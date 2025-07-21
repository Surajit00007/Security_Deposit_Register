# Security Deposit Register 🧾

A comprehensive web-based management system for tracking security deposits, EMD (Earnest Money Deposit), and SD (Security Deposit) records for agencies and companies.

## Features

### 🏢 Agency Database Management
- Add and manage agency/company information
- PAN number validation and formatting
- Search and filter agencies
- Edit and delete agency records

### 💰 Deposit Recording
- Record EMD and SD deposits
- Track tender details and bill information
- Manage treasury voucher (TV) numbers and challan details
- Handle work completion status and defect liability periods

### 💸 Payment Processing
- Record payments against deposits
- Multi-challan support for complex payments
- Automatic calculation of total payment amounts
- Link payments to existing deposit records

### 📊 Records Management
- View all deposit and payment records
- Search and filter by various criteria
- Edit existing records
- Real-time balance calculations

### 📈 Reporting System
- Generate abstract and detailed reports
- Filter by agency, year, or date range
- Export reports for external use
- Summary cards showing key financial metrics

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: Browser LocalStorage (client-side)
- **Styling**: Custom CSS with responsive design
- **Icons**: Unicode emojis for visual appeal

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required - runs entirely in the browser

### Installation

1. **Clone or download** the repository
2. **Navigate** to the project folder
3. **Open** `src/index.html` in your web browser

### Deployment

#### Local Development
```bash
# Simply open the HTML file
open src/index.html
```

#### Web Deployment (Netlify, GitHub Pages, etc.)
1. Upload the `src` folder contents to your hosting service
2. Set `index.html` as the main file
3. The app will work immediately - no build process required

## File Structure

```
SubrataSahooAPP/
├── src/
│   ├── index.html      # Main application interface
│   ├── script.js       # Application logic and functionality
│   └── style.css       # Styling and responsive design
└── README.md           # This file
```

## Usage

### 1. Agency Management
- Start by adding agencies in the "Agency Database" tab
- Enter PAN numbers (format: ABCDE1234F) and company names
- Use the search feature to quickly find agencies

### 2. Recording Deposits
- Select an agency from the dropdown
- Choose deposit type (EMD or SD)
- Fill in tender details, bill information, and treasury data
- Save the deposit record

### 3. Recording Payments
- Select agency and tender number
- Choose from available challans or enter manually
- System automatically calculates total payment amounts
- Link payments to existing deposits

### 4. Viewing Records
- Browse all deposits and payments in organized tables
- Use search functionality to filter records
- Edit records by clicking the edit button

### 5. Generating Reports
- Select report criteria (agency, date range, format)
- View summary statistics and detailed breakdowns
- Export reports for external use

## Data Storage

- All data is stored locally in your browser using LocalStorage
- Data persists between sessions on the same browser
- **Important**: Data is device/browser specific and not synced across devices
- Consider regular exports for backup purposes

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Contributing

This is a standalone application. For modifications:

1. Edit the HTML structure in `index.html`
2. Modify styling in `style.css`
3. Update functionality in `script.js`
4. Test thoroughly across different browsers

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues or questions:
- Check browser console for error messages
- Ensure JavaScript is enabled in your browser
- Verify all files are in the correct directory structure

---

**Made with ❤️ for efficient security deposit management**