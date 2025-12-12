document.addEventListener('DOMContentLoaded', function() {
    const calendarContainer = document.getElementById('calendar-container');
    const submitBtn = document.getElementById('submit-btn');
    const thankYouMessage = document.getElementById('thank-you-message');

    const today = new Date();
    // Set hours, minutes, seconds, and milliseconds to 0 to compare dates accurately
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today.getFullYear(), 11, 31);

    function getNthDayOfWeek(year, month, dayOfWeek, n) {
        const date = new Date(year, month, 1);
        let count = 0;
        while (date.getMonth() === month) {
            if (date.getDay() === dayOfWeek) {
                count++;
                if (count === n) {
                    return date;
                }
            }
            date.setDate(date.getDate() + 1);
        }
        return null;
    }

    function getHolidays(year) {
        // Federal Holidays
        const holidays = [
            // New Year's Day
            new Date(year, 0, 1),
            // Martin Luther King, Jr. Day (Third Monday in January)
            getNthDayOfWeek(year, 0, 1, 3),
            // Presidents' Day (Third Monday in February)
            getNthDayOfWeek(year, 1, 1, 3),
            // Memorial Day (Last Monday in May)
            (d => { d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; })(new Date(year, 5, 0)),
            // Juneteenth National Independence Day
            new Date(year, 5, 19),
            // Independence Day
            new Date(year, 6, 4),
            // Labor Day (First Monday in September)
            getNthDayOfWeek(year, 8, 1, 1),
            // Columbus Day (Second Monday in October)
            getNthDayOfWeek(year, 9, 1, 2),
            // Veterans Day
            new Date(year, 10, 11),
            // Thanksgiving Day (Fourth Thursday in November)
            getNthDayOfWeek(year, 10, 4, 4),
            // Christmas Day
            new Date(year, 11, 25),
        ];

        return holidays.filter(Boolean).map(date => {
            // Adjust for holidays falling on weekends
            if (date.getDay() === 6) { // Saturday
                date.setDate(date.getDate() - 1); // Move to Friday
            } else if (date.getDay() === 0) { // Sunday
                date.setDate(date.getDate() + 1); // Move to Monday
            }
            return date;
        });
    }


    const holidays = getHolidays(today.getFullYear());

    let selectedDates = [];

    function isWeekend(date) {
        return date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
    }

    function isHoliday(date) {
        return holidays.some(holiday => holiday.toDateString() === date.toDateString());
    }

    function createCalendarMonth(year, month) {
        const monthContainer = document.createElement('div');
        monthContainer.classList.add('month-container');

        const monthHeader = document.createElement('h2');
        monthHeader.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthContainer.appendChild(monthHeader);

        const gridContainer = document.createElement('div');
        gridContainer.classList.add('calendar-grid');


        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            dayHeader.classList.add('calendar-day-header');
            gridContainer.appendChild(dayHeader);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const startingDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            gridContainer.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            dayElement.dataset.date = date.toISOString();

            if (date < today || isWeekend(date) || isHoliday(date)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => {
                    dayElement.classList.toggle('selected');
                    const dateString = dayElement.dataset.date;
                    if (dayElement.classList.contains('selected')) {
                        selectedDates.push(dateString);
                    } else {
                        selectedDates = selectedDates.filter(d => d !== dateString);
                    }
                });
            }
            gridContainer.appendChild(dayElement);
        }
        monthContainer.appendChild(gridContainer);
        calendarContainer.appendChild(monthContainer);
    }

    function generateCalendars() {
        let currentMonth = today.getMonth();
        let currentYear = today.getFullYear();

        while (currentYear < endDate.getFullYear() || (currentYear === endDate.getFullYear() && currentMonth <= endDate.getMonth())) {
            createCalendarMonth(currentYear, currentMonth);
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }
    }


    submitBtn.addEventListener('click', () => {
        fetch('/api/dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dates: selectedDates })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            thankYouMessage.style.display = 'block';
            submitBtn.style.display = 'none';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while submitting your dates. Please try again.');
        });
    });

    generateCalendars();
});