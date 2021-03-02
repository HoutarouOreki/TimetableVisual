var DayEvent = /** @class */ (function () {
    function DayEvent() {
        this.collidingEvents = [];
    }
    return DayEvent;
}());
var groupColors = {};
var placedEvents = [];
var daysContainerWidth = 300;
var minHour = 8;
var maxHour = 20;
// 1 "column" contains this many hours
// (maxHour-minHour) should be divisible by this
var hourDisplayStep = 2;
//var days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
var days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
var dayContentContainersDictionary = {};
var daysContainer;
var hoursContainer;
/////////
document.addEventListener("DOMContentLoaded", function () {
    daysContainer = document.getElementById("days-container");
    hoursContainer = document.getElementById("hours-container");
    generateDays();
    generateHours();
    generateDayContentContainers();
    generateCheckboxes();
    wireUpSelectorButtons();
});
/////////
function generateDays() {
    var dayNameContainers = document.getElementById("day-name-containers");
    days.forEach(function (day) {
        var dayNameContainer = document.createElement("div");
        dayNameContainer.className = "day-name-container";
        dayNameContainer.textContent = day;
        dayNameContainers.appendChild(dayNameContainer);
    });
}
function generateHours() {
    var hourNamesContainer = document.getElementById("hour-names-container");
    for (var hour = minHour; hour < maxHour; hour += hourDisplayStep) {
        var time = hoursToHourMinute(hour);
        var hourNameContainer = document.createElement("div");
        hourNameContainer.textContent = time.hour + ":" + (time.minute < 10 ? "0" : "") + time.minute;
        hourNameContainer.className = "hour-name-container";
        hourNameContainer.style.left = calculateTimePositionPercentage(hour) + "%";
        hourNamesContainer.appendChild(hourNameContainer);
    }
}
function generateDayContentContainers() {
    var dayContentContainers = document.getElementById("day-content-containers");
    days.forEach(function (day) {
        var dayContainer = document.createElement("div");
        dayContainer.className = "day-content-container";
        dayContentContainers.appendChild(dayContainer);
        dayContentContainersDictionary[day] = dayContainer;
        generateDaySeparators(dayContainer);
    });
}
function generateDaySeparators(container) {
    for (var i = minHour + hourDisplayStep; i < maxHour; i += hourDisplayStep) {
        var timePercentage = calculateTimePositionPercentage(i);
        var separator = document.createElement("div");
        separator.className = "day-time-separator";
        separator.style.left = timePercentage + "%";
        container.appendChild(separator);
    }
}
function generateCheckboxes() {
    readTextFile("timetablesList.txt", function (t) {
        var fieldset = document.getElementById("timetables-fieldset");
        t.split("\n").forEach(function (line) {
            var _a = line.split(" / "), name = _a[0], path = _a[1], color = _a[2];
            var div = document.createElement("div");
            div.className = "form-check form-switch";
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            var checkboxId = "timetable-checkbox-" + path;
            checkbox.id = checkboxId;
            checkbox.addEventListener("change", onCheckboxChange);
            div.appendChild(checkbox);
            var label = document.createElement("label");
            label.textContent = name;
            label.htmlFor = checkboxId;
            div.appendChild(label);
            fieldset.appendChild(div);
            groupColors[path] = color;
        });
    });
}
function wireUpSelectorButtons() {
    var groupSelector = document.getElementById("group-selector");
    var closeButton = document.getElementById("group-selector-close-button");
    closeButton.addEventListener("click", function () {
        groupSelector.classList.add("d-none");
    });
    var openButton = document.getElementById("group-selector-open-button");
    openButton.addEventListener("click", function () {
        groupSelector.classList.remove("d-none");
    });
}
////////
function onCheckboxChange() {
    clearTimetables();
    var inputElements = document.getElementsByTagName("input");
    var selectedTimetables = [];
    for (var i = 0; i < inputElements.length; i++) {
        if (inputElements[i].type == "checkbox" && inputElements[i].checked) {
            selectedTimetables.push(inputElements[i].id.replace("timetable-checkbox-", ""));
        }
    }
    selectedTimetables.forEach(function (timetableName) {
        readTextFile("timeTables/" + timetableName + ".txt", function (t) {
            return parseGenerateTimetable(t, timetableName);
        });
    });
}
function clearTimetables() {
    placedEvents.forEach(function (placedEvent) {
        placedEvent.div.remove();
    });
    placedEvents.length = 0;
}
////////
function calculateTimePositionPercentage(hours) {
    return (hours - minHour) / (maxHour - minHour) * 100;
}
function calculateTimePercentages(startHours, endHours) {
    var end = calculateTimePositionPercentage(endHours);
    var start = calculateTimePositionPercentage(startHours);
    var duration = end - start;
    return { start: start, end: end, duration: duration };
}
function calculateEventTimePercentages(dayEvent) {
    return calculateTimePercentages(dayEvent.startHour, dayEvent.endHour);
}
function placeDayEvent(dayEvent, groupPath) {
    var _a;
    var timePercentages = calculateEventTimePercentages(dayEvent);
    var dayEventDiv = document.createElement("div");
    dayEventDiv.className = "day-event";
    dayEventDiv.style.left = timePercentages.start + "%";
    dayEventDiv.style.width = timePercentages.duration + "%";
    var dayEventContentContainer = document.createElement("div");
    dayEventContentContainer.className = "day-event-content-container";
    dayEventDiv.appendChild(dayEventContentContainer);
    var dayEventBackground = document.createElement("div");
    dayEventBackground.className = "day-event-background";
    dayEventBackground.style.backgroundColor = (_a = groupColors[groupPath]) !== null && _a !== void 0 ? _a : "gray";
    dayEventDiv.appendChild(dayEventBackground);
    var dayEventContent = document.createElement("div");
    dayEventContent.className = "day-event-content";
    dayEventContentContainer.appendChild(dayEventContent);
    if (dayEvent.title != null) {
        var title = document.createElement("p");
        title.className = "day-event-title";
        title.textContent = dayEvent.title;
        dayEventContent.appendChild(title);
        if (dayEvent.description != null) {
            var description = document.createElement("p");
            description.className = "day-event-description";
            description.textContent = dayEvent.description;
            dayEventContent.appendChild(description);
        }
    }
    var hours = document.createElement("p");
    hours.className = "day-event-hours";
    hours.textContent = hoursToString(dayEvent.startHour) + " - " + hoursToString(dayEvent.endHour);
    dayEventContent.appendChild(hours);
    dayContentContainersDictionary[dayEvent.weekDay].appendChild(dayEventDiv);
    dayEvent.div = dayEventDiv;
    findAdjustWithCollidingEvents(dayEvent);
    placedEvents.push(dayEvent);
}
function findAdjustWithCollidingEvents(event) {
    var collidingEvents = [];
    placedEvents.forEach(function (placedEvent) {
        if (placedEvent.weekDay == event.weekDay) {
            if ((event.startHour <= placedEvent.startHour && event.endHour >= placedEvent.endHour) ||
                (event.startHour > placedEvent.startHour && event.startHour < placedEvent.endHour) ||
                (event.endHour > placedEvent.startHour && event.endHour < placedEvent.endHour)) {
                collidingEvents.push(placedEvent);
                placedEvent.collidingEvents.forEach(function (e) {
                    if (!collidingEvents.includes(e)) {
                        collidingEvents.push(e);
                    }
                    if (!e.collidingEvents.includes(event)) {
                        e.collidingEvents.push(event);
                    }
                });
            }
        }
    });
    collidingEvents.push(event);
    for (var i = 0; i < collidingEvents.length; i++) {
        var collidingEvent = collidingEvents[i];
        var heightPercent = 1 / collidingEvents.length * 100;
        collidingEvent.div.style.height = heightPercent + "%";
        collidingEvent.div.style.top = i * heightPercent + "%";
        if (collidingEvents.length > 1 && !collidingEvent.div.classList.contains("black-border-bottom")) {
            collidingEvent.div.classList.add("black-border-bottom");
        }
    }
}
function hourMinuteToHours(hour, minute) {
    return hour + (minute / 60);
}
function hoursToHourMinute(hours) {
    var hour = Math.floor(hours);
    var minute = Math.floor((hours - hour) * 60);
    return { hour: hour, minute: minute };
}
////////////
function hourMinuteToString(hour, minute) {
    return hour + ":" + (minute < 10 ? "0" : "") + minute;
}
function hoursToString(hours) {
    var _a = hoursToHourMinute(hours), hour = _a.hour, minute = _a.minute;
    return hourMinuteToString(hour, minute);
}
///////////
function readTextFile(sciezka, callback) {
    fetch(sciezka)
        .then(function (response) { return response.text(); })
        .then(function (data) {
        callback(data.replace(/[\r]+/g, ""));
    });
}
function parseGenerateTimetable(t, groupPath) {
    var lines = t.split("\n");
    var dayNameRegex = /^(.+):$/;
    var dayEventRegex = /^(?:\t|\s{4})(\d+):(\d+) ?- ?(\d+):(\d+):?$/;
    var dayEventDescription = /^(?:\t|\s{4}){2}(.*)$/;
    var currentDay;
    var currentEvent;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (/^\s*$/.test(line)) {
            continue;
        }
        var dayNameMatch = execRegex(dayNameRegex, line);
        if (dayNameMatch != null) {
            currentDay = dayNameMatch[1];
            continue;
        }
        var eventMatch = execRegex(dayEventRegex, line);
        if (eventMatch != null) {
            if (currentEvent != undefined) {
                placeDayEvent(currentEvent, groupPath);
            }
            currentEvent = new DayEvent();
            currentEvent.weekDay = currentDay;
            currentEvent.startHour = hourMinuteToHours(parseInt(eventMatch[1]), parseInt(eventMatch[2]));
            currentEvent.endHour = hourMinuteToHours(parseInt(eventMatch[3]), parseInt(eventMatch[4]));
            continue;
        }
        var descriptionLineMatch = execRegex(dayEventDescription, line);
        if (descriptionLineMatch != null) {
            if (currentEvent.title == null) {
                currentEvent.title = descriptionLineMatch[1];
            }
            else if (currentEvent.description == null) {
                currentEvent.description = descriptionLineMatch[1];
            }
            else {
                currentEvent.description += " " + descriptionLineMatch[1];
            }
        }
    }
    ;
    if (currentEvent != undefined) {
        placeDayEvent(currentEvent, groupPath);
    }
}
function execRegex(regex, text) {
    regex.lastIndex = 0;
    return regex.exec(text);
}
