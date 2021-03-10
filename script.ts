class DayEvent {
    weekDay: string;
    startHour: number;
    endHour: number;
    title: string | null;
    description: string | null;
    div: HTMLDivElement;
    collidingEvents: DayEvent[] = [];
}

var timetablesColors = {};

var placedEvents: DayEvent[] = [];

var daysContainerWidth = 300
var minHour = 8;
var maxHour = 20;

// 1 "column" contains this many hours
// (maxHour-minHour) should be divisible by this
var hourDisplayStep = 2;

//var days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
var days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
var dayContentContainersDictionary = {};

var daysContainer: HTMLElement;
var hoursContainer: HTMLElement;

var insideGroups = {};

var timetablesKeys: string[] = [];
var timetablesEvents: { [timetableKey: string]: DayEvent[] } = {};

/////////

document.addEventListener("DOMContentLoaded", () => {
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
    for (var  i =0; i < timetablesKeys.length; i++) {
        loadTimetable(timetablesKeys[i]);
    }
}

function loadTimetable(timetableKey: string) {
    if (!notGroupedRegex.test(timetableKey)) {
        return;
    }
    readTextFile("timeTables/" + timetableKey + ".txt", (t: string) => {
        parseTimetable(t).forEach(e => timetablesEvents[timetableKey].push(e));
    });
}

function generateDays() {
    let dayNameContainers = document.getElementById("day-name-containers");
    days.forEach(day => {
        let dayNameContainer = document.createElement("div");
        dayNameContainer.className = "day-name-container";
        dayNameContainer.textContent = day;
        dayNameContainers.appendChild(dayNameContainer);
    });
}

function generateHours() {
    let hourNamesContainer = document.getElementById("hour-names-container");
    for (let hour = minHour; hour < maxHour; hour += hourDisplayStep) {
        let time = hoursToHourMinute(hour);

        let hourNameContainer = document.createElement("div");
        hourNameContainer.textContent = time.hour + ":" + (time.minute < 10 ? "0" : "") + time.minute;
        hourNameContainer.className = "hour-name-container";
        hourNameContainer.style.left = calculateTimePositionPercentage(hour) + "%";
        hourNamesContainer.appendChild(hourNameContainer);
    }
}

function generateDayContentContainers() {
    let dayContentContainers = document.getElementById("day-content-containers");
    days.forEach(day => {
        var dayContainer = document.createElement("div");
        dayContainer.className = "day-content-container";
        dayContentContainers.appendChild(dayContainer);
        dayContentContainersDictionary[day] = dayContainer;

        generateDaySeparators(dayContainer);
    });
}

function generateDaySeparators(container: HTMLDivElement) {
    for (var i = minHour + hourDisplayStep; i < maxHour; i += hourDisplayStep) {
        const timePercentage = calculateTimePositionPercentage(i);

        let separator = document.createElement("div");
        separator.className = "day-time-separator";
        separator.style.left = timePercentage + "%";

        container.appendChild(separator);
    }
}

function generateCheckboxes(callback: Function) {
    readTextFile("timetablesList.txt", (t: string) => {
        let fieldset = document.getElementById("timetables-fieldset");
        t.split("\n").forEach((line: string) => {
            let [name, key, color] = line.split(" / ");
            if (!color) {
                color = "rgba(0, 0, 0, 0)"
            }

            let div = document.createElement("div");
            div.className = "form-check form-switch";

            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            let checkboxId = "timetable-checkbox-" + key;
            checkbox.id = checkboxId;

            checkbox.addEventListener("change", e => onCheckboxChange(e))

            div.appendChild(checkbox);

            let label = document.createElement("label");
            let square = document.createElement("a");
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
    let groupSelector = document.getElementById("group-selector");
    let closeButton = document.getElementById("group-selector-close-button");
    closeButton.addEventListener("click", () => {
        groupSelector.classList.add("d-none");
    });
    let openButton = document.getElementById("group-selector-open-button");
    openButton.addEventListener("click", () => {
        groupSelector.classList.remove("d-none");
    });
}

////////

function getNameOrNamesFromCheckboxId(id: string) {
    return id.replace("timetable-checkbox-", "");
}

////////

let notGroupedRegex = /^[^ ]+?$/;

function selectSubgroups(ids: string[]) {
    ids.forEach(id => {
        let checkbox = document.getElementById("timetable-checkbox-" + id) as HTMLInputElement;
        checkbox.checked = true;
    });
}

function unselectParentsOf(id: string) {
    let inputElements = document.getElementsByTagName("input");
    for (var i = 0; i < inputElements.length; i++) {
        if (!notGroupedRegex.test(inputElements[i].id) && inputElements[i].type == "checkbox"
            && inputElements[i].checked) {
            let childrenNames = getNameOrNamesFromCheckboxId(inputElements[i].id).split(" ");
            if (childrenNames.includes(id)) {
                inputElements[i].checked = false;
            }
        }
    }
}

let alreadyChanging = false;

function onCheckboxChange(e: Event | null) {
    if (alreadyChanging) {
        return;
    }

    alreadyChanging = true;

    if (e) {
        let inputElement = e.target as HTMLInputElement;
        if (inputElement.type == "checkbox" && !notGroupedRegex.test(inputElement.id)
            && inputElement.checked) {
            selectSubgroups(getNameOrNamesFromCheckboxId(inputElement.id).split(" "));
        } else if (inputElement.type == "checkbox" && !inputElement.checked) {
            // unchecking a sub-element of a group
            // needs to uncheck parent
            unselectParentsOf(getNameOrNamesFromCheckboxId(inputElement.id));
        }
    }

    clearTimetables();

    let inputElements = document.getElementsByTagName("input");
    let selectedTimetables: string[] = [];
    for (var i = 0; i < inputElements.length; i++) {
        if (inputElements[i].type == "checkbox" && inputElements[i].checked) {
            let nameOrNames = getNameOrNamesFromCheckboxId(inputElements[i].id);
            if (/^[^ ]+?$/.test(nameOrNames)) { // single group
                selectedTimetables.push(nameOrNames);
            }
        }
    }
    selectedTimetables.forEach(timetableKey => populateTimetable(timetableKey));

    alreadyChanging = false;
}

function clearTimetables() {
    placedEvents.forEach(placedEvent => {
        placedEvent.div.remove();
    });
    placedEvents.length = 0;
}

function populateTimetable(timetableKey: string) {
    timetablesEvents[timetableKey].forEach(e => placeDayEvent(e, timetableKey));
}

////////

function calculateTimePositionPercentage(hours: number) {
    return (hours - minHour) / (maxHour - minHour) * 100;
}

function calculateTimePercentages(startHours: number, endHours: number) {
    let end = calculateTimePositionPercentage(endHours);
    let start = calculateTimePositionPercentage(startHours);
    let duration = end - start;
    return { start, end, duration };
}

function calculateEventTimePercentages(dayEvent: DayEvent) {
    return calculateTimePercentages(dayEvent.startHour, dayEvent.endHour);
}

function placeDayEvent(dayEvent: DayEvent, timetableKey: string) {
    const timePercentages = calculateEventTimePercentages(dayEvent);

    let dayEventDiv = document.createElement("div");
    dayEventDiv.className = "day-event";
    dayEventDiv.style.left = timePercentages.start + "%";
    dayEventDiv.style.width = timePercentages.duration + "%";

    let dayEventContentContainer = document.createElement("div");
    dayEventContentContainer.className = "day-event-content-container";
    dayEventDiv.appendChild(dayEventContentContainer);

    let dayEventBackground = document.createElement("div");
    dayEventBackground.className = "day-event-background";
    dayEventBackground.style.backgroundColor = timetablesColors[timetableKey] ?? "gray";
    dayEventDiv.appendChild(dayEventBackground);

    let dayEventContent = document.createElement("div");
    dayEventContent.className = "day-event-content";
    dayEventContentContainer.appendChild(dayEventContent);

    if (dayEvent.title != null) {
        let title = document.createElement("p");
        title.className = "day-event-title";
        title.textContent = dayEvent.title;
        dayEventContent.appendChild(title);
        if (dayEvent.description != null) {
            let description = document.createElement("p");
            description.className = "day-event-description";
            description.innerText = dayEvent.description;
            dayEventContent.appendChild(description);
        }
    }

    let hours = document.createElement("p");
    hours.className = "day-event-hours";
    hours.textContent = hoursToString(dayEvent.startHour) + " - " + hoursToString(dayEvent.endHour);
    dayEventContent.appendChild(hours);

    dayContentContainersDictionary[dayEvent.weekDay].appendChild(dayEventDiv);
    dayEvent.div = dayEventDiv;

    findAdjustWithCollidingEvents(dayEvent);

    placedEvents.push(dayEvent);
}

function findAdjustWithCollidingEvents(event: DayEvent) {
    let collidingEvents: DayEvent[] = [];
    placedEvents.forEach(placedEvent => {
        if (placedEvent.weekDay == event.weekDay) {
            if ((event.startHour <= placedEvent.startHour && event.endHour >= placedEvent.endHour) ||
                (event.startHour > placedEvent.startHour && event.startHour < placedEvent.endHour) ||
                (event.endHour > placedEvent.startHour && event.endHour < placedEvent.endHour)) {
                collidingEvents.push(placedEvent);
                placedEvent.collidingEvents.forEach(e => {
                    if (!collidingEvents.includes(e)) {
                        collidingEvents.push(e);
                    }
                    if (!e.collidingEvents.includes(event)) {
                        e.collidingEvents.push(event);
                    }
                })
            }
        }
    });

    collidingEvents.push(event);
    for (var i = 0; i < collidingEvents.length; i++) {
        const collidingEvent = collidingEvents[i];
        const heightPercent = 1 / collidingEvents.length * 100;
        collidingEvent.div.style.height = heightPercent + "%";
        collidingEvent.div.style.top = i * heightPercent + "%";
    }
}

function hourMinuteToHours(hour: number, minute: number) {
    return hour + (minute / 60);
}

function hoursToHourMinute(hours: number) {
    let hour = Math.floor(hours);
    let minute = Math.floor((hours - hour) * 60);
    return { hour, minute };
}

////////////


function hourMinuteToString(hour: number, minute: number) {
    return hour + ":" + (minute < 10 ? "0" : "") + minute;
}

function hoursToString(hours: number) {
    let { hour, minute } = hoursToHourMinute(hours);
    return hourMinuteToString(hour, minute);
}

///////////

function readTextFile(sciezka: string, callback: Function) {
    fetch(sciezka)
        .then(response => response.text())
        .then((data) => {
            callback(data.replace(/[\r]+/g, ""));
        });
}

function parseTimetable(t: string): DayEvent[] {
    let events: DayEvent[] = [];

    const lines = t.split("\n");

    const dayNameRegex = /^(.+):$/
    const dayEventRegex = /^(?:\t|\s{4})(\d+):(\d+) ?- ?(\d+):(\d+):?$/
    const dayEventDescription = /^(?:\t|\s{4}){2}(.*)$/

    let currentDay: string;
    let currentEvent: DayEvent;

    for (var i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*$/.test(line)) {
            continue;
        }
        let dayNameMatch = execRegex(dayNameRegex, line);
        if (dayNameMatch != null) {
            currentDay = dayNameMatch[1];
            continue;
        }
        let eventMatch = execRegex(dayEventRegex, line);
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
        let descriptionLineMatch = execRegex(dayEventDescription, line);
        if (descriptionLineMatch != null) {
            if (currentEvent.title == null) {
                currentEvent.title = descriptionLineMatch[1];
            } else if (currentEvent.description == null) {
                currentEvent.description = descriptionLineMatch[1];
            } else {
                currentEvent.description += "\n" + descriptionLineMatch[1];
            }
        }
    };

    if (currentEvent != undefined) {
        events.push(currentEvent);
    }

    return events;
}

function execRegex(regex: RegExp, text: string) {
    regex.lastIndex = 0;
    return regex.exec(text);
}