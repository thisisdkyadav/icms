import { parse } from 'csv-parse';
import Participant from '../models/Participant.js';
import Event from '../models/Event.js';
import { generateQRCode } from '../utils/qrGenerator.js';
import { sendEmail } from '../utils/emailService.js';
import { generateCertificate } from '../utils/certificateGenerator.js';

// Import participants from CSV
export const importFromCSV = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({ message: 'Participants array required' });
    }

    const createdParticipants = [];

    for (const p of participants) {
      const qrData = `${eventId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const participant = new Participant({
        name: p.name,
        email: p.email,
        phone: p.phone || '',
        event: eventId,
        qrCode: qrData,
        transactionId: p.transactionId || '',
        transactionTime: p.transactionTime || '',
        amount: p.amount || '',
        paymentMode: p.paymentMode || '',
        dataFields: p.dataFields || {}
      });

      await participant.save();
      createdParticipants.push(participant);
    }

    res.status(201).json({
      message: `${createdParticipants.length} participants imported`,
      participants: createdParticipants
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get participants by event
export const getByEvent = async (req, res) => {
  try {
    const participants = await Participant.find({ event: req.params.eventId });
    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send QR codes to participants
export const sendQRCodes = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantIds } = req.body;

    let query = { event: eventId };
    if (participantIds && participantIds.length > 0) {
      query._id = { $in: participantIds };
    }

    const participants = await Participant.find(query);
    const event = await Event.findById(eventId);
    let sentCount = 0;

    for (const p of participants) {
      try {
        const qrImage = await generateQRCode(p.qrCode);
        await sendEmail({
          to: p.email,
          subject: `Your QR Code for ${event?.name || 'Event'}`,
          html: `
            <h2>Hello ${p.name}!</h2>
            <p>Thank you for registering for <strong>${event?.name || 'the event'}</strong>.</p>
            <p>Please find your QR code attached. Present this QR code at the venue for attendance.</p>
            <p><strong>Event Date:</strong> ${event?.date ? new Date(event.date).toLocaleDateString() : 'TBA'}</p>
            <br>
            <p>Best regards,<br>ICMS Team</p>
          `,
          attachments: [{
            filename: 'qrcode.png',
            content: qrImage,
            encoding: 'base64'
          }]
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send QR to ${p.email}:`, err);
      }
    }

    res.json({ message: `QR codes sent to ${sentCount} participants` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { qrCode } = req.body;

    const participant = await Participant.findOne({ qrCode }).populate('event', 'name');
    
    if (!participant) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (participant.attended) {
      return res.json({ 
        message: 'Already marked as attended',
        participant,
        alreadyAttended: true
      });
    }

    participant.attended = true;
    await participant.save();

    res.json({
      message: 'Attendance marked successfully',
      participant,
      alreadyAttended: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send certificates with PDF
export const sendCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantIds } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let query = { event: eventId, attended: true };
    if (participantIds && participantIds.length > 0) {
      query._id = { $in: participantIds };
    }

    const participants = await Participant.find(query);
    let sentCount = 0;

    for (const p of participants) {
      try {
        const pdfBuffer = await generateCertificate(p.name, event.name, event.date);

        await sendEmail({
          to: p.email,
          subject: `Your Certificate - ${event.name}`,
          html: `
            <h2>Congratulations ${p.name}!</h2>
            <p>Thank you for participating in <strong>${event.name}</strong>.</p>
            <p>Please find your Certificate of Participation attached as a PDF.</p>
            <br>
            <p>Best regards,<br>ICMS Team</p>
          `,
          attachments: [{
            filename: `Certificate_${p.name.replace(/\s/g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send certificate to ${p.email}:`, err);
      }
    }

    res.json({ message: `Certificates sent to ${sentCount} participants` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send payment receipts
export const sendReceipts = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantIds } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let query = { event: eventId };
    if (participantIds && participantIds.length > 0) {
      query._id = { $in: participantIds };
    }

    const participants = await Participant.find(query);
    let sentCount = 0;

    for (const p of participants) {
      if (!p.transactionId) continue; // Skip if no payment info

      try {
        await sendEmail({
          to: p.email,
          subject: `Payment Receipt - ${event.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Payment Receipt</h2>
              
              <p>Dear <strong>${p.name}</strong>,</p>
              <p>Thank you for your payment for <strong>${event.name}</strong>.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Event</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${event.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${p.name}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${p.email}</td>
                </tr>
                ${p.phone ? `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Phone</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${p.phone}</td>
                </tr>
                ` : ''}
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction ID</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${p.transactionId}</td>
                </tr>
                ${p.transactionTime ? `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction Time</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${p.transactionTime}</td>
                </tr>
                ` : ''}
                ${p.amount ? `
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">₹${p.amount}</td>
                </tr>
                ` : ''}
                ${p.paymentMode ? `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Mode</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${p.paymentMode}</td>
                </tr>
                ` : ''}
              </table>
              
              <p style="color: #27ae60; font-weight: bold;">✓ Payment Confirmed</p>
              
              <p>Best regards,<br>ICMS Team</p>
            </div>
          `
        });

        // Mark receipt as sent
        p.receiptSent = true;
        await p.save();
        sentCount++;
      } catch (err) {
        console.error(`Failed to send receipt to ${p.email}:`, err);
      }
    }

    res.json({ message: `Receipts sent to ${sentCount} participants` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send notifications
export const sendNotifications = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantIds, subject, message } = req.body;

    const event = await Event.findById(eventId);

    let query = { event: eventId };
    if (participantIds && participantIds.length > 0) {
      query._id = { $in: participantIds };
    }

    const participants = await Participant.find(query);
    let sentCount = 0;

    for (const p of participants) {
      try {
        await sendEmail({
          to: p.email,
          subject: subject || `Notification - ${event?.name || 'Event'}`,
          html: `
            <h2>Hello ${p.name}!</h2>
            <p>${message}</p>
            <br>
            <p>Best regards,<br>ICMS Team</p>
          `
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to notify ${p.email}:`, err);
      }
    }

    res.json({ message: `Notifications sent to ${sentCount} participants` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
