class DayEvent {
    weekDay: string;
    startHour: number;
    endHour: number;
    title: string | null;
    description: string | null;
}

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

/////////

document.addEventListener("DOMContentLoaded", () => {
    daysContainer = document.getElementById("days-container");
    hoursContainer = document.getElementById("hours-container");

    generateDays();
    generateHours();
    generateDayContentContainers();

    readTextFile("timeTables/Jarek.txt", parseTimeTableText);
});

/////////

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

function placeDayEvent(dayEvent: DayEvent) {
    const timePercentages = calculateEventTimePercentages(dayEvent);

    let dayEventDiv = document.createElement("div");
    dayEventDiv.className = "day-event";
    dayEventDiv.style.marginLeft = timePercentages.start + "%";
    dayEventDiv.style.width = timePercentages.duration + "%";

    let dayEventContent = document.createElement("div");
    dayEventContent.className = "day-event-content";
    dayEventDiv.appendChild(dayEventContent);

    if (dayEvent.title != null) {
        let title = document.createElement("p");
        title.className = "day-event-title";
        title.textContent = dayEvent.title;
        dayEventContent.appendChild(title);
        if (dayEvent.description != null) {
            let description = document.createElement("p");
            description.className = "day-event-description";
            description.textContent = dayEvent.description;
            dayEventContent.appendChild(description);
        }
    }

    let hours = document.createElement("p");
    hours.className = "day-event-hours";
    hours.textContent = hoursToString(dayEvent.startHour) + " - " + hoursToString(dayEvent.endHour);
    dayEventContent.appendChild(hours);

    dayContentContainersDictionary[dayEvent.weekDay].appendChild(dayEventDiv);
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

function parseTimeTableText(t: string) {
    const lines = t.split("\n");

    const dayNameRegex = /^(.+):$/
    const dayEventRegex = /^(?:\t|\s{4})(\d+):(\d+) ?- ?(\d+):(\d+):?$/
    const dayEventDescription = /^(?:\t|\s{4}){2}(.*)$/

    let currentDay: string;
    let currentEvent: DayEvent;

    for (var i = 0; i < lines.length; i++) {
        const line = lines[i];
        let dayNameMatch = execRegex(dayNameRegex, line);
        if (dayNameMatch != null) {
            currentDay = dayNameMatch[1];
            continue;
        }
        let eventMatch = execRegex(dayEventRegex, line);
        if (eventMatch != null) {
            if (currentEvent != undefined) {
                placeDayEvent(currentEvent);
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
                currentEvent.description += " " + descriptionLineMatch[1];
            }
        }
    };

    if (currentEvent != undefined) {
        placeDayEvent(currentEvent);
    }
}

function execRegex(regex: RegExp, text: string) {
    regex.lastIndex = 0;
    return regex.exec(text);
}