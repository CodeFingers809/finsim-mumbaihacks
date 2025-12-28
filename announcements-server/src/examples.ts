// Example BSE corporate filing announcements to test the system

export const sampleAnnouncements = [
  {
    text: "530565,Popees Cares Ltd,Insider Trading / SAST,Popees Cares Ltd - 530565 - Closure of Trading Window,2025-12-27T12:57:50.58,ab25500117c199bdea71029618ef902cf889474e744a179a569c96736e33d0e2,530565_ab255001.txt,https://www.bseindia.com/xml-data/corpfiling/AttachLive/0d0d08aa-2ba2-4fa2-8d4e-47d924134a13.pdf",
    category: "critical",
  },
  {
    text: "532540,TCS Ltd,Financial Results,Tata Consultancy Services - Q4 Results FY 2024-25,2025-12-27T10:30:00.00,hash123,532540_results.txt,https://www.bseindia.com/xml-data/corpfiling/results.pdf",
    category: "high",
  },
  {
    text: "500325,Reliance Industries,Board Meeting,Reliance Industries - Board Meeting Notice - AGM,2025-12-27T14:15:00.00,hash456,500325_board.txt,https://www.bseindia.com/xml-data/corpfiling/board.pdf",
    category: "medium",
  },
  {
    text: "500180,HDFC Bank,Dividend,HDFC Bank - Record Date for Dividend,2025-12-27T11:00:00.00,hash789,500180_dividend.txt,https://www.bseindia.com/xml-data/corpfiling/dividend.pdf",
    category: "medium",
  },
  {
    text: "532215,Axis Bank,Clarification,Axis Bank - Clarification on News Article,2025-12-27T16:45:00.00,hash101,532215_clarif.txt,https://www.bseindia.com/xml-data/corpfiling/clarif.pdf",
    category: "low",
  },
  {
    text: "500696,Hindustan Unilever,General Updates,Hindustan Unilever - Investor Presentation,2025-12-27T09:30:00.00,hash202,500696_investor.txt,https://www.bseindia.com/xml-data/corpfiling/investor.pdf",
    category: "info",
  },
  {
    text: "532648,YES Bank,Insider Trading / SAST,YES Bank - SAST Violation - Regulatory Action,2025-12-27T13:20:00.00,hash303,532648_sast.txt,https://www.bseindia.com/xml-data/corpfiling/sast.pdf",
    category: "critical",
  },
  {
    text: "500312,ONGC,Acquisition,Oil and Natural Gas Corporation - Major Acquisition Announcement,2025-12-27T12:00:00.00,hash404,500312_acq.txt,https://www.bseindia.com/xml-data/corpfiling/acquisition.pdf",
    category: "high",
  },
];

// Plain text announcements (original format still supported)
export const plainTextAnnouncements = [
  {
    text: "Apple Inc. (AAPL) surges 5.2% after announcing record Q4 earnings. Revenue hits $95.3B, beating analyst expectations by 8%. Stock reaches all-time high of $185.42.",
    category: "high",
  },
  {
    text: "BREAKING: Tesla (TSLA) stock plummets 12% in after-hours trading following disappointing delivery numbers. Q3 deliveries miss estimates by 15,000 vehicles.",
    category: "high",
  },
];

// Test function to send announcement
export async function testAnnouncement(
  announcement: string,
  toNumber: string
) {
  const response = await fetch("http://localhost:4001/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      toNumber,
      announcement,
    }),
  });

  const data = await response.json();
  console.log("Response:", data);
  return data;
}

// Usage example:
// testAnnouncement(sampleAnnouncements[0].text, "+1234567890");
