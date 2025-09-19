import React from 'react';

function Help() {
  const faqs = [
    {
      question: "How do I report an issue?",
      answer: "Click the 'Report Issue' button on the Map page. You'll be asked to provide a photo, a description, and the severity level. The app will automatically capture your location."
    },
    {
      question: "What is an issue's status?",
      answer: "Issues can have one of three statuses: 'New' (just reported), 'In-Progress' (a department is working on it), and 'Resolved' (the issue has been fixed)."
    },
    {
      question: "How can I track my report?",
      answer: "When you submit a report, you will receive a unique Report ID. You can enter this ID in the search bar on the navbar to view the live status of your report."
    },
    {
      question: "I want to be a moderator!",
      answer: "To become a moderator, you need to register and be approved by the system administrators. Please contact the project team directly for more information."
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="h-20"></div> {/* Navbar spacing */}
      
      <main className="container mx-auto p-4 max-w-3xl flex-grow">
        <h1 className="text-4xl font-extrabold text-white mt-8 mb-10 tracking-wide text-center drop-shadow-md">
          Help & FAQs
        </h1>
        
        <section className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-2xl glass">
          <p className="text-sm mb-8 leading-relaxed text-gray-300 text-center">
            Find answers to common questions and learn how to get the most out of Fixit.
          </p>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Help;
