document.addEventListener('DOMContentLoaded', function() {
    const calendarContainer = document.getElementById('calendar-container');
    const submitBtn = document.getElementById('submit-btn');
    const thankYouMessage = document.getElementById('thank-you-message');
    const nameInput = document.getElementById('name-input');
    const summaryContent = document.getElementById('summary-content');

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
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter your name.');
            return;
        }
        if (selectedDates.length === 0) {
            alert('Please select at least one date.');
            return;
        }

        fetch('/api/submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name, dates: selectedDates })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            thankYouMessage.style.display = 'block';
            thankYouMessage.textContent = data.message;
            loadSummary();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while submitting your dates. Please try again.');
        });
    });

    function loadSummary() {
        fetch('/api/submissions')
            .then(response => response.json())
            .then(submissions => {
                displaySummary(submissions);
            })
            .catch(error => {
                console.error('Error loading summary:', error);
            });
    }

    function displaySummary(submissions) {
        if (submissions.length === 0) {
            summaryContent.innerHTML = '<p>No submissions yet.</p>';
            return;
        }

        // Count votes for each date
        const dateVotes = {};
        submissions.forEach(submission => {
            submission.dates.forEach(date => {
                const dateKey = new Date(date).toDateString();
                if (!dateVotes[dateKey]) {
                    dateVotes[dateKey] = { count: 0, users: [], dateString: date };
                }
                dateVotes[dateKey].count++;
                if (!dateVotes[dateKey].users.includes(submission.name)) {
                    dateVotes[dateKey].users.push(submission.name);
                }
            });
        });

        // Find best dates (dates with most votes)
        const maxVotes = Math.max(...Object.values(dateVotes).map(v => v.count));
        const bestDates = Object.entries(dateVotes)
            .filter(([_, data]) => data.count === maxVotes)
            .map(([_, data]) => data);

        // Sort all dates by vote count (descending)
        const sortedDates = Object.entries(dateVotes)
            .map(([_, data]) => data)
            .sort((a, b) => b.count - a.count);

        let html = '<div class="summary-section">';
        
        // Display best dates
        if (bestDates.length > 0) {
            html += '<h3>🎉 Best Dates (Most Popular)</h3>';
            html += '<ul>';
            bestDates.forEach((data, index) => {
                const date = new Date(data.dateString);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐';
                html += `<li style="animation-delay: ${index * 0.1}s;">${medal} <strong>${formattedDate}</strong> - ${data.count} vote(s) from: ${data.users.join(', ')}</li>`;
            });
            html += '</ul>';
        }

        // Display all submissions
        html += '<h3>👥 All Submissions</h3>';
        html += '<div class="submissions-list">';
        submissions.forEach((submission, index) => {
            html += `<div class="submission-item" style="animation-delay: ${index * 0.1}s;">`;
            html += `<strong>👤 ${submission.name}</strong>: `;
            const dateList = submission.dates.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }).join(', ');
            html += `<span style="color: #667eea;">📅 ${dateList}</span>`;
            html += `</div>`;
        });
        html += '</div>';

        // Display all dates with vote counts
        html += '<h3>📊 Date Popularity</h3>';
        html += '<div class="date-popularity">';
        sortedDates.forEach((data, index) => {
            const date = new Date(data.dateString);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            const isBest = data.count === maxVotes;
            html += `<div class="date-vote-item ${isBest ? 'best-date' : ''}" style="animation-delay: ${index * 0.05}s;">`;
            html += `<span class="date-label">📅 ${formattedDate}</span>`;
            html += `<span class="vote-count">👍 ${data.count} vote${data.count !== 1 ? 's' : ''}</span>`;
            html += `<span class="voters">👥 ${data.users.join(', ')}</span>`;
            html += `</div>`;
        });
        html += '</div>';

        html += '</div>';
        summaryContent.innerHTML = html;
    }

    generateCalendars();
    loadSummary();
});