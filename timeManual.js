     
      // Time Tracking Logic
      let timer;
      let totalSeconds = 0;
      let isPaused = false;
      
      // Start time tracking
      function startTracking() {
          const activityName = document.getElementById('activityName').value.trim();
          if (!activityName) {
              alert('Please enter an activity name.');
              return;
          }
      
          document.getElementById('startBtn').disabled = true;
          document.getElementById('pauseBtn').disabled = false;
          document.getElementById('stopBtn').disabled = false;
      
          timer = setInterval(() => {
              if (!isPaused) {
                  totalSeconds++;
                  updateTimerDisplay();
              }
          }, 1000);
      }
      
      // Pause the timer
      function pauseTracking() {
          isPaused = true;
          document.getElementById('pauseBtn').disabled = true;
          document.getElementById('resumeBtn').disabled = false;
      }
      
      // Resume the timer
      function resumeTracking() {
          isPaused = false;
          document.getElementById('pauseBtn').disabled = false;
          document.getElementById('resumeBtn').disabled = true;
      }
      
      // Stop and log the tracked time
      function stopTracking() {
          clearInterval(timer);
          const activityName = document.getElementById('activityName').value.trim();
      
          if (totalSeconds > 0 && activityName) {
              logTimeEntry(activityName, totalSeconds);
          }
      
          resetTimer();
      }
      
      // Update the timer display (HH:MM:SS format)
      function updateTimerDisplay() {
          const { hours, minutes, seconds } = convertSeconds(totalSeconds);
          document.getElementById('timerDisplay').textContent =
              `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      
      // Reset the timer and buttons
      function resetTimer() {
          totalSeconds = 0;
          isPaused = false;
          updateTimerDisplay();
          document.getElementById('activityName').value = '';
      
          document.getElementById('startBtn').disabled = false;
          document.getElementById('pauseBtn').disabled = true;
          document.getElementById('resumeBtn').disabled = true;
          document.getElementById('stopBtn').disabled = true;
      }
      
      // Convert seconds to hours, minutes, seconds
      function convertSeconds(seconds) {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const remainingSeconds = seconds % 60;
          return { hours, minutes, seconds: remainingSeconds };
      }
      
      // Handle manual time entry submission
      document.getElementById('timeForm').addEventListener('submit', function (event) {
          event.preventDefault();
      
          const activity = document.getElementById('activity').value.trim();
          let duration = parseFloat(document.getElementById('duration').value);
      
          if (!activity || isNaN(duration) || duration <= 0) {
              alert('Please enter a valid activity and duration.');
              return;
          }
      
          // Convert float hours to seconds (e.g., 1.5 hours = 1 hour 30 mins)
          const totalSeconds = Math.round(duration * 3600);
          logTimeEntry(activity, totalSeconds);
          updateTimeSummary(duration);
      
          this.reset();
      });
      
      // Log the time entry to the list (with timestamp)
      function logTimeEntry(activity, seconds) {
          if (!activity || isNaN(seconds) || seconds <= 0) return; // Ensure valid entries only
      
          const { hours, minutes } = convertSeconds(seconds);
          const timestamp = new Date().toLocaleString();
      
          const logList = document.querySelector('#timeLogList');
          const li = document.createElement('li');
          li.className = 'list-group-item';
          li.innerHTML = `
              <strong>${activity}:</strong> ${hours} hrs ${minutes} mins 
              <br><small>${timestamp}</small>`;
          logList.appendChild(li);
      
          // Update activity breakdown and summary
          updateActivityBreakdown();
          updateTimeSummary(hours + minutes / 60);
      }
      
      // Update time summary
      function updateTimeSummary(hours) {
          if (isNaN(hours) || hours <= 0) return;
      
          const today = document.getElementById('timeToday');
          const week = document.getElementById('timeWeek');
          const month = document.getElementById('timeMonth');
      
          today.textContent = (parseFloat(today.textContent) + hours).toFixed(2);
          week.textContent = (parseFloat(week.textContent) + hours).toFixed(2);
          month.textContent = (parseFloat(month.textContent) + hours).toFixed(2);
      }
      
      // Update activity breakdown
      function updateActivityBreakdown() {
          const logs = document.querySelectorAll('#timeLogList li');
          const breakdown = {};
      
          logs.forEach(log => {
              const activityMatch = log.innerHTML.match(/<strong>(.*?)<\/strong>/);
              const timeMatch = log.innerHTML.match(/(\d+)\s?hrs?\s?(\d+)?\s?mins?/);
      
              if (activityMatch && timeMatch) {
                  const activity = activityMatch[1];
                  const hours = parseFloat(timeMatch[1]) || 0;
                  const minutes = parseFloat(timeMatch[2]) || 0;
      
                  breakdown[activity] = (breakdown[activity] || 0) + hours + (minutes / 60);
              }
          });
      
          const breakdownList = document.getElementById('activityBreakdown');
          breakdownList.innerHTML = '';
      
          for (const [activity, totalHours] of Object.entries(breakdown)) {
              const li = document.createElement('li');
              li.className = 'list-group-item';
              li.innerHTML = `<strong>${activity}:</strong> ${totalHours.toFixed(2)} hours`;
              breakdownList.appendChild(li);
          }
      }
      
              document.addEventListener('DOMContentLoaded', () => loadLogs());
      
              function loadLogs() {
                  const logs = JSON.parse(localStorage.getItem('logs')) || [];
                  const logList = document.getElementById('manageLog');
                  logList.innerHTML = '';
      
                  logs.forEach((log, index) => {
                      const logItem = document.createElement('li');
                      logItem.className = 'list-group-item log-item';
                      logItem.innerHTML = `
                          <div>
                              ${log.type === 'expense'
                              ? `<strong>${log.name}</strong> - GH₵ ${log.amount} (${log.category})`
                              : `${log.activity} (${log.duration} hrs)`} 
                              <br><small class="timestamp">${log.timestamp}</small>
                          </div>
                          <div>
                              <button class="btn btn-warning btn-small" onclick="editLog(${index})">✏️ Edit</button>
                              <button class="btn btn-danger btn-small" onclick="deleteLog(${index})">🗑️ Delete</button>
                          </div>
                      `;
                      logList.appendChild(logItem);
                  });
              }
      
      
      
      // Update Time Summary
      function updateTimeSummary() {
          const logs = JSON.parse(localStorage.getItem('logs')) || [];
          const today = new Date().toDateString();
          const startOfWeek = getStartOfWeek();
          const startOfMonth = getStartOfMonth();
      
          let todayTotal = 0;
          let weekTotal = 0;
          let monthTotal = 0;
          const activityTotals = {};
      
          logs.forEach(log => {
              if (log.type === 'time') {
                  const logDate = new Date(log.timestamp);
                  const duration = parseFloat(log.duration);
      
                  // Check Today
                  if (logDate.toDateString() === today) {
                      todayTotal += duration;
                  }
      
                  // Check This Week
                  if (logDate >= startOfWeek) {
                      weekTotal += duration;
                  }
      
                  // Check This Month
                  if (logDate >= startOfMonth) {
                      monthTotal += duration;
      
                      // Group by Activity for Breakdown
                      if (!activityTotals[log.activity]) {
                          activityTotals[log.activity] = 0;
                      }
                      activityTotals[log.activity] += duration;
                  }
              }
          });
      
          // Update Time Summary UI
          document.getElementById('timeToday').textContent = todayTotal.toFixed(2);
          document.getElementById('timeWeek').textContent = weekTotal.toFixed(2);
          document.getElementById('timeMonth').textContent = monthTotal.toFixed(2);
      
          // Update Monthly Breakdown UI
          const activityBreakdown = document.getElementById('activityBreakdown');
          activityBreakdown.innerHTML = '';
      
          Object.keys(activityTotals).forEach(activity => {
              const item = document.createElement('li');
              item.className = 'list-group-item';
              item.innerHTML = `${activity}: ${activityTotals[activity].toFixed(2)} hrs`;
              activityBreakdown.appendChild(item);
          });
      }
      
              // Handle Time Form Submission
              document.getElementById('timeForm').addEventListener('submit', (e) => {
          e.preventDefault();
      
          const log = {
              type: 'time',
              activity: e.target.activity.value,
              duration: parseFloat(e.target.duration.value),
              timestamp: new Date().toLocaleString(),
          };
      
          saveLog(log); // Save the time log
          e.target.reset(); // Reset the form
      });
      
      
      
              //Time tracking logic end
      
       
      
      
      