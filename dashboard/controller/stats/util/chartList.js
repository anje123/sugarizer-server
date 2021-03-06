module.exports = function() {
	// json
	var chartList = [
		{
			type: "pie",
			description: "HowStudentsAreLaunchingActivities",
			key: "how-user-launch-activities",
			url: "stats/graph"
		},
		{
			type: "bar",
			description: "HowOftenStudentsAreChangingTheirProfileSettings",
			key: "how-often-user-change-settings",
			url: "stats/graph"
		},
		{
			type: "pie",
			description: "HowStudentsAreActive",
			key: "how-users-are-active",
			url: "stats/graph"
		},
		{
			type: "pie",
			description: "WhatTypeOfClientConnected",
			key: "what-type-of-client-connected",
			url: "stats/graph"
		},
		{
			type: "bar",
			description: "HowManyEntriesByJournal",
			key: "how-many-entries-by-journal",
			url: "stats/graph"
		},
		{
			type: "bar",
			description: "MostActiveClassrooms",
			key: "most-active-classrooms",
			url: "stats/graph"
		},
		{
			type: "bar",
			description: "TopContributors",
			key: "top-contributor",
			url: "graph"
		},
		{
			type: "bar",
			description: "TopClassrooms",
			key: "classrooms-by-student-count",
			url: "stats/graph"
		},
		{
			type: "pie",
			description: "TopActivities",
			key: "top-activities",
			url: "graph"
		},
		{
			type: "timeline",
			description: "HowManyUsersActiveLastWeek",
			key: "how-many-users-active-last-week",
			url: "stats/graph"
		},
		{
			type: "timeline",
			description: "HowManyUsersActiveLastMonth",
			key: "how-many-users-active-last-month",
			url: "stats/graph"
		},
		{
			type: "timeline",
			description: "HowManyUsersActiveLastYear",
			key: "how-many-users-active-last-year",
			url: "stats/graph"
		},
		{
			type: "table",
			description: "RecentStudents",
			key: "recent-students",
			url: "graph",
			headers: ["", "icon", "username", "timestamp"]
		},
		{
			type: "table",
			description: "RecentTeachers",
			key: "recent-teachers",
			url: "graph",
			headers: ["", "username", "timestamp"]
		},
		{
			type: "table",
			description: "RecentAdmins",
			key: "recent-admins",
			url: "graph",
			headers: ["", "username", "timestamp"]
		},
		{
			type: "table",
			description: "RecentEntries",
			key: "recent-activities",
			url: "graph",
			headers: ["", "icon", "activity", "username", "timestamp"]
		}
	];

	return chartList;
};
