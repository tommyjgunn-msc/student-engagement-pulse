// lib/schedule.js

// Function to parse class schedule
function parseSchedule(scheduleString) {
    try {
      // Expected format: "Day, HH:MM" (e.g., "Monday, 14:30")
      const parts = scheduleString.split(', ');
      if (parts.length !== 2) {
        throw new Error(`Invalid schedule format: ${scheduleString}`);
      }
      
      const day = parts[0].trim();
      const time = parts[1].trim();
      
      // Parse time into hours and minutes
      const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
      
      return {
        day,
        hours,
        minutes,
        valid: true
      };
    } catch (error) {
      console.error(`Error parsing schedule: ${scheduleString}`, error);
      return {
        day: null,
        hours: null,
        minutes: null,
        valid: false
      };
    }
  }
  
  // Function to check if the schedule matches current day
  function matchesDay(scheduleString, currentDay) {
    const schedule = parseSchedule(scheduleString);
    if (!schedule.valid) return false;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[currentDay];
    
    return schedule.day === currentDayName;
  }
  
  // Function to calculate class end time (assuming 90-minute classes)
  function calculateEndTime(scheduleString) {
    const schedule = parseSchedule(scheduleString);
    if (!schedule.valid) return null;
    
    // Create a date object with today's date and the class time
    const now = new Date();
    const classTime = new Date(now);
    classTime.setHours(schedule.hours, schedule.minutes, 0, 0);
    
    // Add 90 minutes for class duration
    const endTime = new Date(classTime);
    endTime.setMinutes(endTime.getMinutes() + 90);
    
    return endTime;
  }
  
  // Function to check if a class just ended (within the last 5 minutes)
  function classJustEnded(scheduleString, currentTime = new Date()) {
    const endTime = calculateEndTime(scheduleString);
    if (!endTime) return false;
    
    // Calculate 5 minutes after class end
    const emailTime = new Date(endTime);
    emailTime.setMinutes(emailTime.getMinutes() + 5);
    
    // Check if current time is within 1 minute of the email send time
    const diff = Math.abs(currentTime - emailTime);
    const withinRange = diff <= 60000; // 60000 milliseconds = 1 minute
    
    console.log(`Class end time: ${endTime.toLocaleTimeString()}`);
    console.log(`Email send time: ${emailTime.toLocaleTimeString()}`);
    console.log(`Current time: ${currentTime.toLocaleTimeString()}`);
    console.log(`Time difference: ${diff / 1000} seconds`);
    
    return withinRange;
  }
  
  module.exports = { parseSchedule, matchesDay, calculateEndTime, classJustEnded };