/**
 * Helper script to generate a sample employee handbook PDF
 * Run this once to create the sample PDF: node scripts/generate-sample-pdf.js
 * 
 * Note: This requires the 'pdfkit' package. Install it with:
 * npm install --save-dev pdfkit
 */

const fs = require('fs');
const path = require('path');

// Check if PDFKit is installed
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (error) {
  console.error('❌ PDFKit is not installed.');
  console.log('\nTo use this script, first install PDFKit:');
  console.log('  npm install --save-dev pdfkit');
  console.log('\nAlternatively, you can:');
  console.log('  1. Open uploads/sample_handbook_content.txt');
  console.log('  2. Copy content to Word/Google Docs');
  console.log('  3. Save as PDF: uploads/sample_employee_handbook.pdf');
  process.exit(1);
}

const handbookContent = `
EMPLOYEE HANDBOOK
ABC Company

Welcome to ABC Company! This handbook outlines our company policies and procedures.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VACATION AND PAID TIME OFF (PTO) POLICY

Full-time employees accrue PTO at the following rates:
  • 0-2 years of service: 15 days per year
  • 3-5 years of service: 20 days per year
  • 6+ years of service: 25 days per year

PTO accrues on a monthly basis and can be used for vacation, sick time, or personal days.

Employees must submit PTO requests at least two weeks in advance through the employee portal. Requests are subject to manager approval based on business needs.

Unused PTO rolls over up to a maximum of 5 days per year. Any excess will be forfeited.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPANY HOLIDAYS

ABC Company observes the following paid holidays:
  • New Year's Day
  • Martin Luther King Jr. Day
  • Memorial Day
  • Independence Day (July 4th)
  • Labor Day
  • Thanksgiving Day
  • Day after Thanksgiving
  • Christmas Eve
  • Christmas Day
  • New Year's Eve

If a holiday falls on a weekend, the company will observe it on the nearest weekday.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BENEFITS INFORMATION

Health Insurance:
ABC Company offers comprehensive health insurance coverage including medical, dental, and vision. The company covers 80% of premiums for employees and 60% for dependents. Open enrollment occurs annually in November, with coverage beginning January 1st.

Retirement Plan:
Employees are eligible to participate in the company 401(k) plan after 90 days of employment. The company matches 50% of employee contributions up to 6% of salary.

Life Insurance:
The company provides basic life insurance coverage equal to 1x annual salary at no cost to employees. Additional coverage can be purchased.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORK HOURS AND ATTENDANCE

Standard work hours are Monday through Friday, 9:00 AM to 5:00 PM, with a one-hour lunch break.

Employees are expected to arrive on time and notify their supervisor if they will be late or absent. Three unexcused absences within a 90-day period may result in disciplinary action.

Remote work arrangements may be available depending on role and manager approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CODE OF CONDUCT

Professional Behavior:
All employees are expected to conduct themselves professionally and treat colleagues, clients, and vendors with respect.

Dress Code:
Business casual attire is expected Monday through Thursday. Casual dress is permitted on Fridays.

Confidentiality:
Employees must maintain confidentiality of proprietary company information and client data.

Harassment and Discrimination:
ABC Company maintains a zero-tolerance policy for harassment and discrimination of any kind. All employees have the right to work in an environment free from harassment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIME-OFF REQUEST PROCEDURES

To request time off:
  1. Log into the employee portal at portal.abccompany.com
  2. Navigate to the "Time Off" section
  3. Select the dates and type of leave requested
  4. Submit the request to your manager
  5. You will receive email confirmation once approved

Emergency time off should be communicated to your manager by phone as soon as possible, followed by a formal request in the portal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFORMANCE REVIEWS

All employees receive formal performance reviews annually, typically in the month of their hire anniversary. Reviews assess:
  • Job performance and goal achievement
  • Skills and competencies
  • Areas for development
  • Compensation adjustments

Mid-year check-ins are conducted informally to provide ongoing feedback.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMPLOYEE DEVELOPMENT

ABC Company is committed to employee growth and development. Employees may request:
  • Professional development courses and certifications (subject to budget approval)
  • Conference attendance (one per year with manager approval)
  • Tuition reimbursement up to $5,000 per year for job-related education

All development requests must be submitted through the Learning & Development team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TERMINATION AND RESIGNATION

Voluntary Resignation:
Employees who wish to resign should provide at least two weeks' written notice to their manager and HR.

Exit Interviews:
All departing employees will be invited to participate in a confidential exit interview.

Final Paycheck:
Final paychecks, including any accrued PTO payout, will be issued on the next regular pay date following the last day of work.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT INFORMATION

Human Resources: hr@abccompany.com | (555) 123-4567
IT Support: itsupport@abccompany.com | (555) 123-4568
Payroll: payroll@abccompany.com | (555) 123-4569

Main Office:
ABC Company
123 Business Street
Suite 100
City, State 12345

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This handbook is subject to change. Employees will be notified of any policy updates via email.

Last Updated: October 2024
`;

function generatePDF() {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const outputPath = path.join(process.cwd(), 'uploads', 'sample_employee_handbook.pdf');

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Add title
  doc.fontSize(24).font('Helvetica-Bold').text('EMPLOYEE HANDBOOK', { align: 'center' });
  doc.fontSize(18).font('Helvetica').text('ABC Company', { align: 'center' });
  doc.moveDown(2);

  // Split content into sections and format
  const sections = handbookContent.trim().split('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  sections.forEach((section, index) => {
    if (index === 0) {
      // Skip the title section as we already added it
      return;
    }

    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();

    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    // Add section title
    doc.fontSize(14).font('Helvetica-Bold').text(title, { underline: true });
    doc.moveDown(0.5);

    // Add section content
    doc.fontSize(10).font('Helvetica').text(content, { align: 'left', lineGap: 3 });
    doc.moveDown(1.5);
  });

  doc.end();

  stream.on('finish', () => {
    console.log('✅ Sample PDF generated successfully!');
    console.log(`   Location: ${outputPath}`);
    console.log('\nYou can now start the development server with: npm run dev');
  });

  stream.on('error', (err) => {
    console.error('❌ Error generating PDF:', err);
  });
}

// Run the generator
generatePDF();

