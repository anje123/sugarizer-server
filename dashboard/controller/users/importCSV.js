// include libraries
var request = require('request'),
	csv = require('csv-parser'),
	fs = require('fs'),
	common = require('../../helper/common'),
	xocolors = require('../../helper/xocolors')(),
	regexValidate = require('../../helper/regexValidate');

var users = require('./index');

// Define user with parameterized constructor
class User {
	constructor(name, type, language, color, password, classroom, comment) {
		this.status = 0;
		this.comment = comment ? comment : "";
		this._id = "";
		this.name = name;
		this.type = type;
		this.language = language;
		this.color = color;
		this.stroke = "";
		this.fill = "";
		this.password = password;
		this.classroom = classroom;
	}
}

// Trim and lowercase string
function cleanString(string) {
	if (!string) return;
	string = string.trim();
	string = string.toLowerCase();
	return string;
}

// Get random color from xocolors and generate color string
function getRandomColorString() {
	var randomColor = xocolors[Math.floor(Math.random()*xocolors.length)];
	randomColor = JSON.stringify(randomColor);
	return randomColor;
}

// Generate Color String from stroke and fill
function getColorString(stroke, fill) {
	return JSON.stringify({
		"stroke": stroke,
		"fill": fill
	});
}

// Validate color string
function isValidColor(stroke, fill) {
	var color;
	if (typeof stroke == "string" && typeof fill == "string") {
		color = {
			"stroke": stroke,
			"fill": fill
		};
	} else {
		return false;
	}

	// Look for the color in xocolors
	for (var i=0; i<xocolors.length; i++) {
		if (xocolors[i].stroke == color.stroke && xocolors[i].fill == color.fill) {
			return true;
		}
	}
	return false;
}

// Validate language
function isValidLanguage(lang) {
	var sugarizerLang = ["en", "es", "fr", "de", "pt", "ar", "ja", "pl", "ibo", "yor"];
	if(sugarizerLang.indexOf(lang) == -1) return false;
	else return true;
}

// Validate user role
function isValidType(type) {
	var roles = ["admin", "student", "teacher"];
	if (roles.indexOf(type) == -1) return false;
	else return true;
}

// Generate random password
function generatePassword(length) {
	var password = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXabcdefghijklmnopqrstuvwxyz0123456789"; // All alphanumeric characters except 'Y' and 'Z'

	for (var i = 0; i < length; i++)
		password += possible.charAt(Math.floor(Math.random() * possible.length));

	return password;
}

// Validate data row
function validateUserRow(user) {
	user.comment = "";

	if (!user.name || !regexValidate("user").test(user.name)) {
		return;
	}

	user.type = cleanString(user.type);
	if (!isValidType(user.type)) {
		user.type = "student";
	}

	user.language = cleanString(user.language);
	if (!isValidLanguage(user.language)) {
		user.language = "en";
	}

	if (!isValidColor(user.stroke, user.fill)) {
		user.color = getRandomColorString();
	} else {
		user.color = getColorString(user.stroke, user.fill);
	}

	var minPass = (users.ini() && users.ini().security && parseInt(users.ini().security.min_password_size)) ? parseInt(users.ini().security.min_password_size) : 4;
	if (!user.password || typeof user.password != "string" || user.password.length < minPass || !regexValidate("pass").test(user.password)) {
		user.password = generatePassword(minPass);
		user.comment += "Given password was invalid (Generated random password). ";
	}

	user.classroom = user.classroom ? user.classroom.trim() : "";
	user.classroom = user.classroom.split(',');

	var validClassrooms = [];
	if (user.classroom && user.classroom.length > 0) {
		for (var i=0; i<user.classroom.length; i++) {
			var thisClassroom = user.classroom[i] ? user.classroom[i].trim() : "";
			if (thisClassroom && (typeof thisClassroom != "string" || !regexValidate("user").test(thisClassroom))) {
				user.comment += "Classroom name " + JSON.stringify(thisClassroom) + " was invalid (Classroom dropped). ";
			} else if (thisClassroom) {
				validClassrooms.push(thisClassroom);
			}
		}
	}
	user.classroom = validClassrooms;

	return user;
}


module.exports = function profile(req, res) {
	// reinit l10n and moment with locale
	common.reinitLocale(req);

	// Define authorization level
	var authLevel = 0;
	if (req.session && req.session.user && req.session.user.user) {
		if (req.session.user.user.role == "admin") {
			authLevel = 2;
		} else if (req.session.user.user.role == "teacher") {
			authLevel = 1;
		}
	}

	// Initialize the array that will contains all the users read from CSV
	var AdminsStudents = [];
	var Teachers = [];
	var InvalidUsers = [];

	// Function to stringift user class object
	function stringifyUser(user) {
		if (user.type == "teacher") {
			var classrooms = [];
			for (var i=0; i < user.classroom.length; i++) {
				if (Classrooms[user.classroom[i]] && Classrooms[user.classroom[i]].data && Classrooms[user.classroom[i]].data._id && classrooms.indexOf(Classrooms[user.classroom[i]].data._id) == -1) {
					classrooms.push(Classrooms[user.classroom[i]].data._id);
				}
			}
			classrooms = JSON.stringify(classrooms);
			return '{"name":"' + user.name + '", ' +
            '"color":' + user.color + ', ' +
            '"role":"' + user.type + '", ' +
            '"password":"' + user.password + '", ' +
			'"language":"' + user.language + '", ' +
			'"classrooms":' + classrooms + ', ' +
            '"options":{"sync":true, "stats":true}}';
		} else {
			return '{"name":"' + user.name + '", ' +
            '"color":' + user.color + ', ' +
            '"role":"' + user.type + '", ' +
            '"password":"' + user.password + '", ' +
            '"language":"' + user.language + '", ' +
            '"options":{"sync":true, "stats":true}}';
		}
	}

	// Insert User
	function insertUser(Users, i) {
		return new Promise(function(resolve, reject) {
			request({
				headers: common.getHeaders(req),
				json: true,
				method: 'post',
				uri: common.getAPIUrl() + 'api/v1/users',
				body: {
					user: stringifyUser(Users[i])
				}
			}, function(error, response, body) {
				if (response.statusCode == 200) {
					Users[i].status = 1;
					Users[i]._id = body._id;
					resolve(body);
				} else {
					Users[i].comment += body.error;
					body.user = Users[i];
					reject(body);
				}
			});
		});
	}

	// Initiate Classrooms object
	var Classrooms = {}; // Contains {classname{ students: [students_array], data: classroom_data }

	function stringifyExistingClassroom(name) {
		var newStudents = Classrooms[name].students;
		var oldStudents = [];
		if (Classrooms[name].data && Classrooms[name].data.students && Classrooms[name].data.students.length > 0) {
			oldStudents = Classrooms[name].data.students;
		}
		var union = [...new Set([...newStudents, ...oldStudents])];
		var classroomData = {
			name: name,
			color: Classrooms[name].data.color,
			students: union
		};
		classroomData = JSON.stringify(classroomData);
		return classroomData;
	}

	function stringifyNewClassroom(name) {
		var students = JSON.stringify(Classrooms[name].students);
		return '{"name":"' + name + '","color":' + getRandomColorString() + ',"students":' + students + '}';
	}

	// Update classroom by ID
	function updateClassroom(name) {
		return new Promise(function(resolve, reject) {
			request({
				headers: common.getHeaders(req),
				json: true,
				method: 'put',
				uri: common.getAPIUrl() + 'api/v1/classrooms/' + Classrooms[name].data._id,
				body: {
					classroom: stringifyExistingClassroom(name)
				}
			}, function(error, response, body) {
				body.q = name;
				if (response.statusCode == 200) {
					resolve(body);
				} else {
					reject(body);
				}
			});
		});
	}

	// Insert Classroom
	function insertClassroom(name) {
		return new Promise(function(resolve, reject) {
			request({
				headers: common.getHeaders(req),
				json: true,
				method: 'post',
				uri: common.getAPIUrl() + 'api/v1/classrooms',
				body: {
					classroom: stringifyNewClassroom(name)
				}
			}, function(error, response, body) {
				body.q = name;
				if (response.statusCode == 200) {
					resolve(body);
				} else {
					reject(body);
				}
			});
		});
	}

	// Find Classroom
	function findClassroom(name) {
		return new Promise(function(resolve, reject) {
			var query = {
				sort: '+name',
				q: name
			};
			request({
				headers: common.getHeaders(req),
				json: true,
				method: 'GET',
				qs: query,
				uri: common.getAPIUrl() + 'api/v1/classrooms'
			}, function(error, response, body) {
				body.q = name;
				if (response.statusCode == 200) {
					resolve(body);
				} else {
					reject(body);
				}
			});
		});
	}

	// Create a list of all classrooms in Users
	function getClassroomsNamesFromUsers(Users) {
		var classroomList = [];
		for (var i=0; i<Users.length; i++) {
			if (typeof Users[i].classroom == "object" && Users[i].classroom.length > 0) {
				for (var j=0; j<Users[i].classroom.length; j++) {
					if (classroomList.indexOf(Users[i].classroom[j]) == -1) {
						classroomList.push(Users[i].classroom[j]);
					}
				}
			}
		}
		return classroomList;
	}

	// Find classrooms. Insert classroom if not found
	function findOrCreateClassroom(classes) {
		var classroomProcessed = 0;
		for (var i=0; i < classes.length; i++) {
			findClassroom(classes[i]).then(function(res) {
				if (res && res.classrooms && res.classrooms.length > 0 && res.classrooms[0] && res.q == res.classrooms[0].name) {
				// Confirm Match
					Classrooms[res.q].data = res.classrooms[0];
					updateClassroom(res.q).then(function(res) {
						classroomProcessed++;
						if (res) {
							Classrooms[res.q].data = res;
						} else {
							console.log("Error creating classroom");
						}
						if (classroomProcessed == classes.length) initTeacherAssignment();
					})
						.catch(function(err) {
							classroomProcessed++;
							console.log(err);
							if (classroomProcessed == classes.length) initTeacherAssignment();
						});
				} else {
				// Create Classroom
					insertClassroom(res.q).then(function(res) {
						classroomProcessed++;
						if (res) {
							Classrooms[res.q].data = res;
						} else {
							console.log("Error creating classroom");
						}
						if (classroomProcessed == classes.length) initTeacherAssignment();
					})
						.catch(function(err) {
							classroomProcessed++;
							console.log(err);
							if (classroomProcessed == classes.length) initTeacherAssignment();
						});
				}
			})
				.catch(function(err) {
					classroomProcessed++;
					console.log(err);
					if (classroomProcessed == classes.length) initTeacherAssignment();
				});
		}
	}

	// Processed users for assignment into classrooms
	function initClassroomAssignment() {
		var uniqueClassrooms = getClassroomsNamesFromUsers([...new Set([...AdminsStudents, ...Teachers])]);
		for (var i=0; i<uniqueClassrooms.length; i++) {
			Classrooms[uniqueClassrooms[i]] = {data: "", students: []};
		}
		for (var j=0; j<AdminsStudents.length; j++) {
			if (AdminsStudents[j].status && AdminsStudents[j].type == "student" && AdminsStudents[j]._id && typeof AdminsStudents[j].classroom == "object") {
				for (var k=0; k < AdminsStudents[j].classroom.length; k++) {
					if (AdminsStudents[j].classroom[k] && typeof AdminsStudents[j].classroom[k] == "string" && Classrooms[AdminsStudents[j].classroom[k]] && typeof Classrooms[AdminsStudents[j].classroom[k]].students == "object") {
						// Push user into classroom
						Classrooms[AdminsStudents[j].classroom[k]].students.push(AdminsStudents[j]._id);
					}
				}
			}
		}

		if (uniqueClassrooms.length > 0) findOrCreateClassroom(uniqueClassrooms);
		else initTeacherAssignment();
	}

	// Check students again for valid classrooms
	function revalidateUsers() {
		var validClass;
		var deleteIndex = [];
		for (var i=0; i<AdminsStudents.length; i++) {
			validClass = [];
			if (AdminsStudents[i] && typeof AdminsStudents[i].classroom == "object" && AdminsStudents[i].classroom.length > 0) {
				for (var j=0; j<AdminsStudents[i].classroom.length; j++) {
					if (Classrooms[AdminsStudents[i].classroom[j]] && Classrooms[AdminsStudents[i].classroom[j]].data && Classrooms[AdminsStudents[i].classroom[j]].data.name == AdminsStudents[i].classroom[j]) {
						validClass.push(AdminsStudents[i].classroom[j]);
					}
				}
				AdminsStudents[i].classroom = validClass;
				if (!validClass.length) {
					AdminsStudents[i].comment += "Cannot create user with no valid classroom. ";
					InvalidUsers.push(AdminsStudents[i]);
					deleteIndex.push(i);
				}
			} else {
				AdminsStudents[i].comment += "Cannot create user with empty classroom. ";
				InvalidUsers.push(AdminsStudents[i]);
				deleteIndex.push(i);
			}
		}
		
		deleteIndex.sort(function(a, b){return b - a;});
		for (var i=0; i< deleteIndex.length; i++) {
			AdminsStudents.splice(deleteIndex[i], 1);
		}

		seedUsers();
	}

	// Get classroom names for teacher classroom validation
	function findClassroomsForTeachers(classes) {
		var classroomProcessed = 0;
		for (var i=0; i < classes.length; i++) {
			findClassroom(classes[i]).then(function(res) {
				if (res && res.classrooms && res.classrooms.length > 0 && res.classrooms[0] && res.q == res.classrooms[0].name) {
					// Confirm Match
					Classrooms[res.q].data = res.classrooms[0];
				}
				classroomProcessed++;
				if (classroomProcessed == classes.length) revalidateUsers();
			})
				.catch(function(err) {
					classroomProcessed++;
					console.log(err);
					if (classroomProcessed == classes.length) revalidateUsers();
				});
		}
	}

	// Seed users in DB
	function seedUsers() {
		var usersProcessed = 0;
		// Insert all users
		for (var i=0; i < AdminsStudents.length; i++) {
			insertUser(AdminsStudents, i).then(function() {
				usersProcessed++;
				if (usersProcessed == AdminsStudents.length) initClassroomAssignment();
			}).catch(function() {
				usersProcessed++;
				if (usersProcessed == AdminsStudents.length) initClassroomAssignment();
			});
		}
		if (AdminsStudents.length == 0) {
			initClassroomAssignment();
		}
	}

	// Initiate seeding to DB
	function initSeed() {
		if (authLevel > 1) {
			seedUsers();
		} else {
			var uniqueClassrooms = getClassroomsNamesFromUsers(AdminsStudents);
			for (var i=0; i<uniqueClassrooms.length; i++) {
				Classrooms[uniqueClassrooms[i]] = {data: "", students: []};
			}
			findClassroomsForTeachers(uniqueClassrooms);
		}
	}

	// Return JSON Response
	function returnResponse() {
		var allUsers = [...new Set([...AdminsStudents, ...Teachers, ...InvalidUsers])];
		var importCount = 0;
		var color, stroke, fill;
		var classrooms;
		for (var i=0; i<allUsers.length; i++) {
			stroke = ""; fill = ""; color = "";
			classrooms = "";
			if (allUsers[i]) {
				if (allUsers[i].status == 1) {
					importCount++;
				}

				// Check if valid JSON for color
				try {
					color = JSON.parse(allUsers[i]['color']);
				} catch (e) {
					color = allUsers[i]['color'];
				}
				if (color && color.stroke && color.fill) {
					stroke = color.stroke;
					fill = color.fill;
				}
				allUsers[i]['stroke'] = stroke;
				allUsers[i]['fill'] = fill;
				delete allUsers[i].color;

				// Convert classroom into string
				if (typeof allUsers[i].classroom == 'object' && allUsers[i].classroom.length > 0) {
					for (var j=0; j < allUsers[i].classroom.length; j++) {
						if (allUsers[i].classroom[j] && typeof allUsers[i].classroom[j] == "string") {
							classrooms += allUsers[i].classroom[j];
							classrooms += ", ";
						}
					}
					if (classrooms) classrooms = classrooms.substring(0, classrooms.length - 2);
				} else if (typeof allUsers[i].classroom == 'string') {
					classrooms = allUsers[i].classroom;
				}
				allUsers[i].classroom = classrooms;
			}
		}
		res.json({success: true, msg: common.l10n.get('ImportSuccess', {count: importCount}), data: allUsers});
		return;
	}

	// Initiate Teacher Assignment
	function initTeacherAssignment() {
		if (Teachers.length > 0) {
			var usersProcessed = 0;
			// Insert all teachers
			for (var i=0; i < Teachers.length; i++) {
				insertUser(Teachers, i).then(function() {
					usersProcessed++;
					if (usersProcessed == Teachers.length) returnResponse();
				}).catch(function() {
					usersProcessed++;
					if (usersProcessed == Teachers.length) returnResponse();
				});
			}
		} else {
			returnResponse();
		}
	}

	if (authLevel > 0) {
		// Reading and validating file
		fs.createReadStream(req.file.path)
			.on('error', function(err) {
				throw err;
			})
			.pipe(csv())
			.on('data', function(row) {
				var validRow = validateUserRow(row);
				if (validRow) {
					if (validRow.type == "teacher") {
						if (authLevel > 1) {
							Teachers.push(new User(validRow.name, validRow.type, validRow.language, validRow.color, validRow.password, validRow.classroom, validRow.comment));
						} else {
							InvalidUsers.push(new User(row.name, row.type, row.language, row.color, row.password, row.classroom, "Unauthorized"));
						}
					} else {
						if (authLevel > 1) {
							AdminsStudents.push(new User(validRow.name, validRow.type, validRow.language, validRow.color, validRow.password, validRow.classroom, validRow.comment));
						} else {
							if (validRow.type == "admin") {
								InvalidUsers.push(new User(row.name, row.type, row.language, row.color, row.password, row.classroom, "Unauthorized"));
							} else {
								AdminsStudents.push(new User(validRow.name, validRow.type, validRow.language, validRow.color, validRow.password, validRow.classroom, validRow.comment));
							}
						}
					}
				} else {
					InvalidUsers.push(new User(row.name, row.type, row.language, row.color, row.password, row.classroom, "Invalid Username"));
				}
			})
			.on('end', function() {
			// Finished processing CSV file
				fs.unlinkSync(req.file.path); // remove temp file

				var AllUsers = [...new Set([...AdminsStudents, ...Teachers])];

				if (AllUsers.length == 0) {
					res.json({success: false, msg: common.l10n.get('NoUsers')});
					return;
				}
				initSeed();
			});
	} else {
		res.json({success: false, msg: common.l10n.get('ErrorCode19')});
		return;
	}
};
