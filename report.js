// TONE CHART 
// Aaj ki date automatic
const today = new Date();
const options = { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
};
const dateString = today.toLocaleDateString('en-US', options);
document.getElementById('reportDate').textContent = '📅 ' + dateString;

// Tone data store karne ke liye
let toneHistory = [];
let volumeHistory = [];
let timeLabels = [];
let seconds = 0;

// Har 5 second mein Zakia ka data lo
setInterval(function() {

  // Zakia ke variables use kar rahi hoon
  // jo tone_detection.js mein hain
  const volume = currentVolume;    // Zakia ka variable
  const speaking = isSpeaking;     // Zakia ka variable
  const pitch = currentPitch;      // Zakia ka variable

  // Tone calculate karo pitch se
  // Low pitch = Calm
  // High pitch = Tense
  let toneValue = 1; // default calm

  if (!speaking) {
    toneValue = 0;        // silent
  } else if (pitch > 250) {
    toneValue = 3;        // tense — high pitch
  } else if (pitch > 150) {
    toneValue = 2;        // neutral
  } else {
    toneValue = 1;        // calm — low pitch
  }

  // Data arrays mein add karo
  toneHistory.push(toneValue);
  volumeHistory.push(volume);
  timeLabels.push(seconds + 's');

  seconds += 5;

  // Chart update karo
  updateCharts();

}, 5000); // har 5 second mein

// ================================
// TONE CHART BANAO
// ================================
const toneCtx = document
  .getElementById('toneChart')
  .getContext('2d');

const toneChart = new Chart(toneCtx, {
  type: 'line',
  data: {
    labels: timeLabels,
    datasets: [{
      label: 'Tone',
      data: toneHistory,
      borderColor: '#1D9E75',
      backgroundColor: 'rgba(29,158,117,0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#1D9E75',
      pointRadius: 5,
    }]
  },
  options: {
    responsive: true,
    animation: false,    // smooth update
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            if (value === 0) return '🔇 Silent';
            if (value === 1) return '😊 Calm';
            if (value === 2) return '😐 Neutral';
            if (value === 3) return '😤 Tense';
            return '';
          }
        }
      },
      x: {
        grid: { display: false }
      }
    }
  }
});

// ================================
// VOLUME CHART BANAO
// ================================
const volumeCtx = document
  .getElementById('volumeChart')
  .getContext('2d');

const volumeChart = new Chart(volumeCtx, {
  type: 'bar',
  data: {
    labels: timeLabels,
    datasets: [{
      label: 'Volume %',
      data: volumeHistory,
      backgroundColor: '#1D9E75',
      borderRadius: 6,
    }]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: value => value + '%'
        }
      },
      x: {
        grid: { display: false }
      }
    }
  }
});

// ================================
// CHARTS UPDATE FUNCTION
// ================================
function updateCharts() {
  // Tone chart update
  toneChart.data.labels = timeLabels;
  toneChart.data.datasets[0].data = toneHistory;
  toneChart.update();

  // Volume chart update
  volumeChart.data.labels = timeLabels;
  volumeChart.data.datasets[0].data = volumeHistory;
  volumeChart.update();
}