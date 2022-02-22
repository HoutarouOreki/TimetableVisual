var DayEvent = /** @class */ (function () {
    function DayEvent() {
        this.collidingEvents = [];
    }
    return DayEvent;
}());
var timetablesColors = {};
var placedEvents = [];
var daysContainerWidth = 300;
var minHour = 8;
var maxHour = 20.5;
// 1 "column" contains this many hours
// (maxHour-minHour) should be divisible by this
var hourDisplayStep = 2;
//var days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
var days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
var dayContentContainersDictionary = {};
var daysContainer;
var hoursContainer;
var insideGroups = {};
var timetablesKeys = [];
var timetablesEvents = {};
/////////
document.addEventListener("DOMContentLoaded", function () {
    daysContainer = document.getElementById("days-container");
    hoursContainer = document.getElementById("hours-container");
    generateDays();
    generateCheckboxes(loadTimetables);
    generateHours();
    generateDayContentContainers();
    wireUpSelectorButtons();
});
/////////
function loadTimetables() {
    for (var i = 0; i < timetablesKeys.length; i++) {
        loadTimetable(timetablesKeys[i]);
    }
}
function loadTimetable(timetableKey) {
    if (!notGroupedRegex.test(timetableKey)) {
        return;
    }
    readTextFile("timeTables/" + timetableKey + ".txt", function (t) {
        parseTimetable(t).forEach(function (e) { return timetablesEvents[timetableKey].push(e); });
    });
}
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
function generateCheckboxes(callback) {
    readTextFile("timetablesList.txt", function (t) {
        var fieldset = document.getElementById("timetables-fieldset");
        t.split("\n").forEach(function (line) {
            var _a = line.split(" / "), name = _a[0], key = _a[1], color = _a[2];
            if (!color) {
                color = "rgba(0, 0, 0, 0)";
            }
            var div = document.createElement("div");
            div.className = "form-check form-switch";
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            var checkboxId = "timetable-checkbox-" + key;
            checkbox.id = checkboxId;
            checkbox.addEventListener("change", function (e) { return onCheckboxChange(e); });
            div.appendChild(checkbox);
            var label = document.createElement("label");
            var square = document.createElement("a");
            square.innerHTML = "&#9632;";
            square.style.color = color;
            label.appendChild(square);
            label.innerHTML += " " + name;
            label.htmlFor = checkboxId;
            div.appendChild(label);
            fieldset.appendChild(div);
            timetablesColors[key] = color;
            timetablesKeys.push(key);
            timetablesEvents[key] = [];
        });
        callback();
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
function getNameOrNamesFromCheckboxId(id) {
    return id.replace("timetable-checkbox-", "");
}
////////
var notGroupedRegex = /^[^ ]+?$/;
function selectSubgroups(ids) {
    ids.forEach(function (id) {
        var checkbox = document.getElementById("timetable-checkbox-" + id);
        checkbox.checked = true;
    });
}
function unselectParentsOf(id) {
    var inputElements = document.getElementsByTagName("input");
    for (var i = 0; i < inputElements.length; i++) {
        if (!notGroupedRegex.test(inputElements[i].id) && inputElements[i].type == "checkbox"
            && inputElements[i].checked) {
            var childrenNames = getNameOrNamesFromCheckboxId(inputElements[i].id).split(" ");
            if (childrenNames.includes(id)) {
                inputElements[i].checked = false;
            }
        }
    }
}
var alreadyChanging = false;
function onCheckboxChange(e) {
    if (alreadyChanging) {
        return;
    }
    alreadyChanging = true;
    if (e) {
        var inputElement = e.target;
        if (inputElement.type == "checkbox" && !notGroupedRegex.test(inputElement.id)
            && inputElement.checked) {
            selectSubgroups(getNameOrNamesFromCheckboxId(inputElement.id).split(" "));
        }
        else if (inputElement.type == "checkbox" && !inputElement.checked) {
            // unchecking a sub-element of a group
            // needs to uncheck parent
            unselectParentsOf(getNameOrNamesFromCheckboxId(inputElement.id));
        }
    }
    clearTimetables();
    var inputElements = document.getElementsByTagName("input");
    var selectedTimetables = [];
    for (var i = 0; i < inputElements.length; i++) {
        if (inputElements[i].type == "checkbox" && inputElements[i].checked) {
            var nameOrNames = getNameOrNamesFromCheckboxId(inputElements[i].id);
            if (/^[^ ]+?$/.test(nameOrNames)) { // single group
                selectedTimetables.push(nameOrNames);
            }
        }
    }
    selectedTimetables.forEach(function (timetableKey) { return populateTimetable(timetableKey); });
    alreadyChanging = false;
}
function clearTimetables() {
    placedEvents.forEach(function (placedEvent) {
        placedEvent.div.remove();
    });
    placedEvents.length = 0;
}
function populateTimetable(timetableKey) {
    timetablesEvents[timetableKey].forEach(function (e) { return placeDayEvent(e, timetableKey); });
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
function placeDayEvent(dayEvent, timetableKey) {
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
    dayEventBackground.style.backgroundColor = (_a = timetablesColors[timetableKey]) !== null && _a !== void 0 ? _a : "gray";
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
            description.innerText = dayEvent.description;
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
function parseTimetable(t) {
    var events = [];
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
                events.push(currentEvent);
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
                currentEvent.description += "\n" + descriptionLineMatch[1];
            }
        }
    }
    ;
    if (currentEvent != undefined) {
        events.push(currentEvent);
    }
    return events;
}
function execRegex(regex, text) {
    regex.lastIndex = 0;
    return regex.exec(text);
}
