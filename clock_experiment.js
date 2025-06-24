console.log("✅ JS file loaded");

const jsPsych = initJsPsych({
  on_finish: () => {},
});

// runTrial is now defined in run_trial.js

// Attach event listener to "Show Trial" button after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('show-trial-button');
  if (button) {
    button.addEventListener('click', runTrial);
  }
});