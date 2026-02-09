import Event from '../models/Event.js';

// Create event (Admin only)
export const createEvent = async (req, res) => {
  try {
    const { name, date, description } = req.body;

    const event = new Event({
      name,
      date,
      description,
      createdBy: req.user._id,
      assignedUsers: [req.user._id]
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all events (filtered by role)
export const getAllEvents = async (req, res) => {
  try {
    let events;
    
    if (req.user.role === 'superadmin') {
      // SuperAdmin sees all events
      events = await Event.find().populate('createdBy', 'name email');
    } else {
      // Admin/SubAdmin sees only assigned events
      events = await Event.find({
        $or: [
          { createdBy: req.user._id },
          { assignedUsers: req.user._id }
        ]
      }).populate('createdBy', 'name email');
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check access for non-superadmin
    if (req.user.role !== 'superadmin') {
      const hasAccess = event.createdBy._id.equals(req.user._id) || 
                        event.assignedUsers.some(u => u._id.equals(req.user._id));
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { name, date, description } = req.body;
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { name, date, description },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign user to event
export const assignUser = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { assignedUsers: userId } },
      { new: true }
    ).populate('assignedUsers', 'name email role');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
