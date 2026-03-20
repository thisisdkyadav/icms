import Event from '../models/Event.js';
import Admin from '../models/Admin.js';

const EVENT_POPULATION = [
  { path: 'createdBy', select: 'name email role' },
  { path: 'assignedUsers', select: 'name email role' }
];

const canManageEvent = (event, user) => {
  if (user.role === 'superadmin') {
    return true;
  }

  return event.createdBy?._id
    ? event.createdBy._id.equals(user._id)
    : event.createdBy.equals(user._id);
};

const canAccessEvent = (event, user) => {
  if (user.role === 'superadmin') {
    return true;
  }

  const isCreator = event.createdBy?._id
    ? event.createdBy._id.equals(user._id)
    : event.createdBy.equals(user._id);

  const isAssigned = event.assignedUsers.some((assignedUser) => (
    assignedUser._id ? assignedUser._id.equals(user._id) : assignedUser.equals(user._id)
  ));

  return isCreator || isAssigned;
};

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
    const populatedEvent = await Event.findById(event._id).populate(EVENT_POPULATION);
    res.status(201).json(populatedEvent);
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
      events = await Event.find().populate(EVENT_POPULATION);
    } else {
      // Admin/SubAdmin sees only assigned events
      events = await Event.find({
        $or: [
          { createdBy: req.user._id },
          { assignedUsers: req.user._id }
        ]
      }).populate(EVENT_POPULATION);
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(EVENT_POPULATION);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canAccessEvent(event, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
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

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'Only the event creator can update this event' });
    }

    event.name = name;
    event.date = date;
    event.description = description;
    await event.save();

    const populatedEvent = await Event.findById(event._id).populate(EVENT_POPULATION);
    res.json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'Only the event creator can delete this event' });
    }

    await event.deleteOne();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign user to event
export const assignUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const [event, userToAssign] = await Promise.all([
      Event.findById(req.params.id).populate(EVENT_POPULATION),
      Admin.findById(userId).select('name email role')
    ]);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'Only the event creator can assign users to this event' });
    }

    if (!userToAssign) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!['admin', 'subadmin'].includes(userToAssign.role)) {
      return res.status(400).json({ message: 'Only admins and sub-admins can be assigned to events' });
    }

    event.assignedUsers.addToSet(userToAssign._id);
    await event.save();

    const populatedEvent = await Event.findById(event._id).populate(EVENT_POPULATION);
    res.json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const unassignUser = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const event = await Event.findById(id).populate(EVENT_POPULATION);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'Only the event creator can remove users from this event' });
    }

    const isCreator = event.createdBy._id.equals(userId);
    if (isCreator) {
      return res.status(400).json({ message: 'The event creator cannot be removed from the event' });
    }

    event.assignedUsers = event.assignedUsers.filter((assignedUser) => !assignedUser._id.equals(userId));
    await event.save();

    const populatedEvent = await Event.findById(event._id).populate(EVENT_POPULATION);
    res.json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
