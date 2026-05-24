// ========================
// DATE
// ========================
const today = new Date();
const options = { year:'numeric', month:'long', day:'numeric' };
document.getElementById('reportDate').textContent = 
  '📅 ' + today.toLocaleDateString('en-US', options);

// ========================
// STATS LOAD KARO
// ========================
const speakSec = localStorage.getItem('speakingSec') || 0;
const interrupts = localStorage.getItem('interruptions') || 0;

document.getElementById('speakStat').textContent = speakSec;
document.getElementById('intStat').textContent = interrupts;

// ========================
// INTERRUPTION TABLE
// ========================
const intLog = JSON.parse(
  localStorage.getItem('interruptionLog') || '[]'
);

const tbody = document.getElementById('intTableBody');

if(intLog.length > 0) {
  tbody.innerHTML = intLog.map(log => {
    const strengthColor = 
      log.strength === 'strong' ? '#1D9E75' :
      log.strength === 'medium' ? '#BA7517' : '#E24B4A';
    return `
      <tr>
        <td>${log.time}</td>
        <td><span class="badge-red">${log.interrupter}</span></td>
        <td><span class="badge-blue">${log.interrupted}</span></td>
        <td style="color:${strengthColor};font-weight:500;">
          ${log.strength}
        </td>
      </tr>
    `;
  }).join('');
} else {
  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;color:#999;">
        No interruptions recorded
      </td>
    </tr>
  `;
}

// ========================
// CHARTS DATA
// ========================
const toneData = JSON.parse(
  localStorage.getItem('toneData') || 'null'
) || [1, 1, 2, 3, 2, 1];

const volumeData = JSON.parse(
  localStorage.getItem('volumeData') || 'null'
) || [20, 40, 60, 80, 50, 30];

const timeLabels = JSON.parse(
  localStorage.getItem('timeLabels') || 'null'
) || ['0s','5s','10s','15s','20s','25s'];

// ========================
// TONE CHART
// ========================
const toneCtx = document
  .getElementById('toneChart')
  .getContext('2d');

new Chart(toneCtx, {
  type: 'line',
  data: {
    labels: timeLabels,
    datasets: [{
      data: toneData,
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
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0, max: 4,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            if(value===0) return '🔇 Silent';
            if(value===1) return '😊 Calm';
            if(value===2) return '😐 Neutral';
            if(value===3) return '😤 Tense';
            return '';
          }
        }
      },
      x: { grid: { display: false } }
    }
  }
});

// ========================
// VOLUME CHART
// ========================
const volumeCtx = document
  .getElementById('volumeChart')
  .getContext('2d');

new Chart(volumeCtx, {
  type: 'bar',
  data: {
    labels: timeLabels,
    datasets: [{
      data: volumeData,
      backgroundColor: '#1D9E75',
      borderRadius: 6,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { callback: v => v + '%' }
      },
      x: { grid: { display: false } }
    }
  }
});
document.getElementById('pdfBtn')
  .addEventListener('click', async () => {

  // Page ka screenshot lo
  const element = document.getElementById('report-main');
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');

  // PDF banao
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgWidth = 210;
  const imgHeight = canvas.height * imgWidth / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  // Download karo
  pdf.save('meeting-report.pdf');
});