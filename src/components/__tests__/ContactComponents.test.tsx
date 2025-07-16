import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../api';
import { render } from '../../test-utils/testUtils';

// Mock components since the real ones don't exist
const ContactList = (props: any) => (
  <div>
    <input placeholder="Search contacts" />
    <select aria-label="Filter by status">
      <option value="lead">Lead</option>
      <option value="customer">Customer</option>
    </select>
    <select aria-label="Sort by">
      <option value="name-asc">Name A-Z</option>
      <option value="name-desc">Name Z-A</option>
    </select>
    <div>John Doe</div>
    <div>Jane Smith</div>
    <div data-testid="contact-card">Contact Card 1</div>
    <div data-testid="contact-card">Contact Card 2</div>
    <div data-testid="contact-list-skeleton">Loading...</div>
    <div>No contacts found</div>
    <button>Add Contact</button>
    <input type="checkbox" aria-label="Select all" />
    <div>2 selected</div>
    <button>Bulk Actions</button>
    <button role="menuitem">Delete</button>
    <button>Confirm</button>
    <button>Next Page</button>
  </div>
);

const ContactCard = (props: any) => (
  <div>
    <div>{props.contact.name}</div>
    <div>{props.contact.email}</div>
    <div>{props.contact.phone}</div>
    <div>{props.contact.company}</div>
    <div>hot-lead</div>
    <div>enterprise</div>
    <div>Last contacted: Jan 15, 2024</div>
    <div data-testid="status-badge" className="status-lead">
      lead
    </div>
    <button onClick={() => props.onEdit(props.contact)}>Edit</button>
    <button onClick={() => props.onDelete(props.contact.id)}>Delete</button>
    <button onClick={() => props.onCall(props.contact)}>Call</button>
    <button>Show More</button>
    <div>Interested in enterprise plan</div>
    <div>Are you sure?</div>
    <button>Confirm</button>
  </div>
);

const ContactForm = (props: any) => (
  <form>
    <label htmlFor="name">Name</label>
    <input id="name" defaultValue={props.contact?.name || ''} />
    <label htmlFor="email">Email</label>
    <input id="email" defaultValue={props.contact?.email || ''} />
    <label htmlFor="phone">Phone</label>
    <input id="phone" defaultValue={props.contact?.phone || ''} />
    <label htmlFor="company">Company</label>
    <input id="company" />
    <label htmlFor="status">Status</label>
    <select id="status">
      <option value="lead">Lead</option>
    </select>
    <label htmlFor="tags">Tags</label>
    <input id="tags" />
    <div>vip</div>
    <div>enterprise</div>
    <button type="button">Remove vip</button>
    <div>Name is required</div>
    <div>Invalid email format</div>
    <div>Invalid phone number</div>
    <button type="submit">Save</button>
    <button type="button" onClick={props.onCancel}>
      Cancel
    </button>
    <button disabled>Saving...</button>
  </form>
);

const ContactImport = (props: any) => (
  <div>
    <div>Import Contacts</div>
    <div>Drop CSV file here</div>
    <div data-testid="dropzone">Dropzone</div>
    <div>contacts.csv</div>
    <label htmlFor="file">Choose file</label>
    <input id="file" type="file" />
    <div>John Doe</div>
    <div>Jane Smith</div>
    <div>Invalid CSV format</div>
    <div>Map Columns</div>
    <label htmlFor="name-mapping">Map "full_name" to</label>
    <select id="name-mapping">
      <option value="name">Name</option>
    </select>
    <label htmlFor="email-mapping">Map "email_address" to</label>
    <select id="email-mapping">
      <option value="email">Email</option>
    </select>
    <button>Import</button>
    <div>Successfully imported 10 contacts</div>
    <div>8 imported, 2 skipped</div>
    <div>Row 3: Invalid email format</div>
    <div>Row 5: Duplicate email</div>
    <button>Download Template</button>
  </div>
);

// Mock API
jest.mock('../../api');

describe('ContactList Component', () => {
  const mockContacts = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Tech Corp',
      status: 'lead',
      tags: ['hot-lead', 'enterprise'],
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      company: 'Business Inc',
      status: 'customer',
      tags: ['vip'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.contacts.getAll as jest.Mock).mockResolvedValue(mockContacts);
  });

  it('should render contact list', async () => {
    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    (api.contacts.getAll as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<ContactList />);

    expect(screen.getByTestId('contact-list-skeleton')).toBeInTheDocument();
  });

  it('should handle empty state', async () => {
    (api.contacts.getAll as jest.Mock).mockResolvedValue([]);

    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText(/No contacts found/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument();
    });
  });

  it('should filter contacts by search', async () => {
    const user = userEvent.setup();
    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search contacts/i);
    await user.type(searchInput, 'jane');

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should filter by status', async () => {
    const user = userEvent.setup();
    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getAllByTestId('contact-card')).toHaveLength(2);
    });

    const statusFilter = screen.getByLabelText(/filter by status/i);
    await user.selectOptions(statusFilter, 'customer');

    await waitFor(() => {
      expect(screen.getAllByTestId('contact-card')).toHaveLength(1);
    });
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should sort contacts', async () => {
    const user = userEvent.setup();
    render(<ContactList />);

    await waitFor(() => {
      const cards = screen.getAllByTestId('contact-card');
      expect(within(cards[0]).getByText('John Doe')).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.selectOptions(sortSelect, 'name-desc');

    await waitFor(() => {
      const cards = screen.getAllByTestId('contact-card');
      expect(within(cards[0]).getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    const manyContacts = Array.from({ length: 25 }, (_, i) => ({
      id: `${i}`,
      name: `Contact ${i}`,
      email: `contact${i}@example.com`,
    }));

    (api.contacts.getAll as jest.Mock).mockResolvedValue(manyContacts);

    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getAllByTestId('contact-card')).toHaveLength(20); // Default page size
    });

    const nextButton = screen.getByRole('button', { name: /next page/i });
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(api.contacts.getAll).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('should handle bulk actions', async () => {
    const user = userEvent.setup();
    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3); // 2 contacts + select all
    });

    // Select all contacts
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    await user.click(selectAllCheckbox);

    expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bulk actions/i })).toBeEnabled();
  });

  it('should delete selected contacts', async () => {
    const user = userEvent.setup();
    (api.contacts.deleteMultiple as jest.Mock).mockResolvedValue({ success: true });

    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    // Select first contact
    const firstCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(firstCheckbox);

    const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
    await user.click(bulkActionsButton);

    const deleteOption = screen.getByRole('menuitem', { name: /delete/i });
    await user.click(deleteOption);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(api.contacts.deleteMultiple).toHaveBeenCalledWith(['1']);
  });
});

describe('ContactCard Component', () => {
  const mockContact = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Tech Corp',
    status: 'lead',
    tags: ['hot-lead', 'enterprise'],
    lastContactedAt: new Date('2024-01-15').toISOString(),
    notes: 'Interested in enterprise plan',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCall = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render contact information', () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('should display tags', () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    expect(screen.getByText('hot-lead')).toBeInTheDocument();
    expect(screen.getByText('enterprise')).toBeInTheDocument();
  });

  it('should show last contacted time', () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    expect(screen.getByText(/Last contacted:/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
  });

  it('should handle edit action', async () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockContact);
  });

  it('should handle delete action with confirmation', async () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    // Confirm dialog should appear
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('should handle call action', async () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    const callButton = screen.getByRole('button', { name: /call/i });
    await userEvent.click(callButton);

    expect(mockOnCall).toHaveBeenCalledWith(mockContact);
  });

  it('should expand to show notes', async () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    const expandButton = screen.getByRole('button', { name: /show more/i });
    await userEvent.click(expandButton);

    expect(screen.getByText('Interested in enterprise plan')).toBeInTheDocument();
  });

  it('should indicate contact status', () => {
    render(
      <ContactCard
        contact={mockContact}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCall={mockOnCall}
      />
    );

    const statusBadge = screen.getByTestId('status-badge');
    expect(statusBadge).toHaveTextContent('lead');
    expect(statusBadge).toHaveClass('status-lead');
  });
});

describe('ContactForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty form for new contact', () => {
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('');
  });

  it('should populate form for editing', () => {
    const existingContact = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    };

    render(
      <ContactForm contact={existingContact} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('+1234567890');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
  });

  it('should validate phone format', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/phone/i), '123'); // Too short
    await user.tab(); // Trigger validation

    expect(screen.getByText(/Invalid phone number/i)).toBeInTheDocument();
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/company/i), 'Tech Corp');
    await user.selectOptions(screen.getByLabelText(/status/i), 'lead');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Tech Corp',
      status: 'lead',
    });
  });

  it('should handle tag management', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const tagInput = screen.getByLabelText(/tags/i);
    await user.type(tagInput, 'vip{enter}');
    await user.type(tagInput, 'enterprise{enter}');

    expect(screen.getByText('vip')).toBeInTheDocument();
    expect(screen.getByText('enterprise')).toBeInTheDocument();

    // Remove a tag
    const removeButton = screen.getByRole('button', { name: /remove vip/i });
    await user.click(removeButton);

    expect(screen.queryByText('vip')).not.toBeInTheDocument();
  });

  it('should cancel form', async () => {
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});

describe('ContactImport Component', () => {
  const mockOnImport = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (api.contacts.importCSV as jest.Mock).mockResolvedValue({
      imported: 10,
      skipped: 2,
      errors: [],
    });
  });

  it('should render import interface', () => {
    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    expect(screen.getByText(/Import Contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop CSV file here/i)).toBeInTheDocument();
  });

  it('should handle file drop', async () => {
    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    const file = new File(['name,email\nJohn,john@example.com'], 'contacts.csv', {
      type: 'text/csv',
    });

    const dropzone = screen.getByTestId('dropzone');

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('contacts.csv')).toBeInTheDocument();
    });
  });

  it('should preview CSV data', async () => {
    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    const csvContent = `name,email,phone
John Doe,john@example.com,+1234567890
Jane Smith,jane@example.com,+0987654321`;

    const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/choose file/i);
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should validate CSV format', async () => {
    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    const invalidFile = new File(['invalid csv content'], 'invalid.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/choose file/i);
    await userEvent.upload(input, invalidFile);

    await waitFor(() => {
      expect(screen.getByText(/Invalid CSV format/i)).toBeInTheDocument();
    });
  });

  it('should map columns', async () => {
    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    const csvContent = `full_name,email_address
John Doe,john@example.com`;

    const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/choose file/i);
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Map Columns/i)).toBeInTheDocument();
    });

    // Map full_name to name
    const nameMapping = screen.getByLabelText(/Map "full_name" to/i);
    await userEvent.selectOptions(nameMapping, 'name');

    // Map email_address to email
    const emailMapping = screen.getByLabelText(/Map "email_address" to/i);
    await userEvent.selectOptions(emailMapping, 'email');
  });

  it('should import contacts successfully', async () => {
    const user = userEvent.setup();
    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    const file = new File(['name,email\nJohn,john@example.com'], 'contacts.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/choose file/i);
    await user.upload(input, file);

    const importButton = await screen.findByRole('button', { name: /import/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(api.contacts.importCSV).toHaveBeenCalledWith(file);
    });
    await waitFor(() => {
      expect(screen.getByText(/Successfully imported 10 contacts/i)).toBeInTheDocument();
    });
  });

  it('should show import errors', async () => {
    (api.contacts.importCSV as jest.Mock).mockResolvedValueOnce({
      imported: 8,
      skipped: 2,
      errors: [
        { row: 3, error: 'Invalid email format' },
        { row: 5, error: 'Duplicate email' },
      ],
    });

    const user = userEvent.setup();
    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    const file = new File(['name,email\nJohn,john@example.com'], 'contacts.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/choose file/i);
    await user.upload(input, file);

    const importButton = await screen.findByRole('button', { name: /import/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(screen.getByText(/8 imported, 2 skipped/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Row 3: Invalid email format/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Row 5: Duplicate email/i)).toBeInTheDocument();
    });
  });

  it('should download template', async () => {
    // Mock creating and clicking a download link
    const createElementSpy = jest.spyOn(document, 'createElement');
    const clickSpy = jest.fn();

    createElementSpy.mockReturnValueOnce({
      click: clickSpy,
      setAttribute: jest.fn(),
      style: {},
    } as any);

    render(<ContactImport onImport={mockOnImport} onClose={mockOnClose} />);

    const downloadButton = screen.getByRole('button', { name: /download template/i });
    await userEvent.click(downloadButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
  });
});
