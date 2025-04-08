// lib/academicCalendar.js
const { readSheet } = require('./sheets');

// Function to check if a given date is a teaching day
async function isTeachingDay(date) {
  try {
    // Format the input date to YYYY-MM-DD
    const formattedDate = formatDate(date);
    
    // Get teaching periods data
    const teachingPeriods = await readSheet('Teaching Periods', 'A2:G100');
    
    // Find the period that contains this date
    const period = teachingPeriods.find(period => {
      const startDate = new Date(period[1]); // StartDate
      const endDate = new Date(period[2]);   // EndDate
      const checkDate = new Date(formattedDate);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
    
    // Return false if no period found or if it's a break
    if (!period || period[6] === 'TRUE') { // IsBreak column
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking teaching day:', error);
    return false;
  }
}

// Function to get current academic context
async function getAcademicContext(date) {
  try {
    // Format the input date to YYYY-MM-DD
    const formattedDate = formatDate(date);
    
    // Get teaching periods data
    const teachingPeriods = await readSheet('Teaching Periods', 'A2:G100');
    
    // Find the period that contains this date
    const period = teachingPeriods.find(period => {
      const startDate = new Date(period[1]); // StartDate
      const endDate = new Date(period[2]);   // EndDate
      const checkDate = new Date(formattedDate);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
    
    // Return default values if no period found
    if (!period) {
      return {
        trimester: null,
        week: null,
        unit: null,
        isSummative: false,
        isBreak: false
      };
    }
    
    return {
      trimester: parseInt(period[0], 10),        // TrimesterID
      week: parseInt(period[3], 10),             // WeekNumber
      unit: parseInt(period[4], 10),             // UnitNumber
      isSummative: period[5] === 'TRUE',         // IsSummative
      isBreak: period[6] === 'TRUE'              // IsBreak
    };
  } catch (error) {
    console.error('Error getting academic context:', error);
    return {
      trimester: null,
      week: null,
      unit: null,
      isSummative: false,
      isBreak: false
    };
  }
}

// Helper function to format date to YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

module.exports = { isTeachingDay, getAcademicContext };