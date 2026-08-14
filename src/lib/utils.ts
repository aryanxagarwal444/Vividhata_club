import { Participant } from '../types';

// Play sound audio beep on successful QR scan
export function playBeepSound(type: 'success' | 'duplicate' | 'error' = 'success') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'duplicate') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.log('Audio Context not available or muted');
  }
}

// Download element or canvas as image
export function downloadQrSvgAsPng(svgElementId: string, filename: string) {
  const svg = document.getElementById(svgElementId) as unknown as SVGElement;
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width || 300;
    canvas.height = img.height || 300;
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${filename}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

// Download Pass as Ticket Image using Canvas rendering
export function downloadPassAsImage(participant: Participant) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 600, 900);
  bgGrad.addColorStop(0, '#0F172A'); // Slate 900
  bgGrad.addColorStop(1, '#1E1B4B'); // Indigo 950
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 900);

  // Border Accent
  ctx.strokeStyle = '#6366F1';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 568, 868);

  // Header Card
  ctx.fillStyle = '#1E293B';
  ctx.roundRect(32, 32, 536, 120, 16);
  ctx.fill();

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ROSTR 2026', 300, 80);

  ctx.fillStyle = '#818CF8';
  ctx.font = '14px sans-serif';
  ctx.fillText('OFFICIAL EVENT DELEGATE PASS', 300, 110);

  // Participant Card
  ctx.fillStyle = '#1E293B';
  ctx.roundRect(32, 172, 536, 320, 16);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(participant.name, 300, 220);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px sans-serif';
  ctx.fillText(`ID: ${participant.participantId}`, 300, 255);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 280);
  ctx.lineTo(540, 280);
  ctx.stroke();

  // Details
  ctx.textAlign = 'left';
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('COLLEGE:', 60, 315);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(participant.college, 170, 315);

  ctx.fillStyle = '#64748B';
  ctx.fillText('DEPARTMENT:', 60, 350);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(`${participant.department} (${participant.year})`, 170, 350);

  ctx.fillStyle = '#64748B';
  ctx.fillText('EMAIL:', 60, 385);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(participant.email, 170, 385);

  ctx.fillStyle = '#64748B';
  ctx.fillText('VENUE:', 60, 420);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText('Grand Convention Center, Tech Park', 170, 420);

  ctx.fillStyle = '#64748B';
  ctx.fillText('DATE & TIME:', 60, 455);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText('October 24, 2026 | 09:00 AM IST', 170, 455);

  // QR Code Section
  ctx.fillStyle = '#FFFFFF';
  ctx.roundRect(175, 510, 250, 250, 16);
  ctx.fill();

  // Draw QR from SVG
  const svg = document.getElementById('pass-qr-code') as unknown as SVGElement;
  if (svg) {
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 190, 525, 220, 220);

      // Footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan QR code at the entrance counter for instant event check-in.', 300, 800);

      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Issued: ${new Date().toLocaleDateString()} | Non-Transferable Delegate Pass`, 300, 830);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${participant.participantId}_Event_Pass.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }
}

// Print Pass
export function printParticipantPass() {
  window.print();
}

// Export Participants to CSV
export function exportParticipantsToCsv(participants: Participant[]) {
  if (!participants.length) return;

  const headers = ['Participant ID', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Attendance Status', 'Checked-In Time', 'QR Token'];
  
  const rows = participants.map(p => [
    p.participantId,
    `"${p.name.replace(/"/g, '""')}"`,
    p.email,
    p.phone,
    `"${p.college.replace(/"/g, '""')}"`,
    `"${p.department.replace(/"/g, '""')}"`,
    p.year,
    p.attendanceStatus,
    p.checkedInAt ? new Date(p.checkedInAt.seconds ? p.checkedInAt.seconds * 1000 : p.checkedInAt).toLocaleString() : 'Not Attended',
    p.qrToken
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Event_Participants_Export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
