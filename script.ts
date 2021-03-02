var daysContainerWidth = 300
var minHour = 8;
var maxHour = 20;
var hourStepDisplay = 2; // 1 "column" contains this many hours

var days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];

var daysContainer: HTMLElement;
var hoursContainer: HTMLElement;

///////////////////

document.addEventListener("DOMContentLoaded", () => {
    daysContainer = document.getElementById("days-container");
    hoursContainer = document.getElementById("hours-container");

    generateDays();
    generateHours();
});

function generateDays()
{
    days.forEach(day => {
        document.createElement("div");
        daysContainer.appendChild(dayNode);
    });
}