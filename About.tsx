import React from "react";
import { Link } from "wouter";
import logoPath from "@assets/bestlogo_1782311057091.png";

export default function Privacy() {
  return (
    <div className="bg-[#050812] text-white min-h-screen">
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <Link href="/">
          <img src={logoPath} alt="BurnCall" className="h-7 mb-10" />
        </Link>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: June 1, 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          {[
            {
              heading: "1. Information We Collect",
              body: `We collect information you provide directly, such as your name, email address, phone number, and business information when you create an account or contact us. We also automatically collect certain information when you use our services, including usage data, device information, and log data such as IP addresses, browser type, and pages visited. Additionally, we may receive lead data that your customers submit through BurnCall-powered lead capture forms on your website or other channels.`,
            },
            {
              heading: "2. How We Use Your Information",
              body: `We use the information we collect to provide, maintain, and improve the BurnCall platform; process transactions and send related information; send technical notices, updates, and support messages; respond to your comments and questions; and monitor usage patterns to improve our service. Lead contact data collected through BurnCall's AI responses is used solely to facilitate communication between you (our customer) and your prospective clients, and is never sold to third parties.`,
            },
            {
              heading: "3. Information Sharing",
              body: `We do not sell your personal information or your customers' contact data to third parties. We may share information with trusted third-party service providers who assist us in operating our platform (such as cloud hosting, SMS delivery, and analytics), subject to confidentiality agreements. We may also disclose information when required by law, to protect our rights, or in connection with a merger or acquisition.`,
            },
            {
              heading: "4. Data Retention",
              body: `We retain your account information for as long as your account is active or as needed to provide services. Lead conversation data is retained for up to 24 months by default. You may request deletion of your data at any time by contacting support@burncall.co. Upon account cancellation, your data is retained for 90 days before permanent deletion.`,
            },
            {
              heading: "5. SMS and Telephone Communications",
              body: `By using BurnCall's missed-call text back and AI SMS features, you authorize BurnCall to send automated text messages to your customers on your behalf using the phone number(s) you configure. You are responsible for ensuring that your use of SMS messaging complies with applicable laws, including TCPA. All SMS messages include opt-out instructions per regulatory requirements.`,
            },
            {
              heading: "6. Security",
              body: `We implement industry-standard security measures including encryption in transit (TLS 1.2+), encryption at rest, access controls, and regular security audits. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and keep your account credentials confidential.`,
            },
            {
              heading: "7. Cookies and Tracking",
              body: `We use cookies and similar tracking technologies to improve your experience, analyze site traffic, and understand where our visitors come from. You can control cookie settings through your browser preferences. Disabling cookies may affect certain features of the platform.`,
            },
            {
              heading: "8. Your Rights",
              body: `Depending on your location, you may have the right to access, correct, or delete your personal information, object to or restrict certain processing, and data portability. To exercise these rights, contact us at privacy@burncall.co. We respond to all requests within 30 days.`,
            },
            {
              heading: "9. Children's Privacy",
              body: `BurnCall is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.`,
            },
            {
              heading: "10. Changes to This Policy",
              body: `We may update this Privacy Policy from time to time. We will notify you of material changes by email or via a prominent notice in our platform. Your continued use of BurnCall after any changes constitutes acceptance of the updated policy.`,
            },
            {
              heading: "11. Contact Us",
              body: `If you have questions or concerns about this Privacy Policy, please contact us at privacy@burncall.co or write to: BurnCall Inc., 123 Innovation Drive, Suite 400, Orlando, FL 32801.`,
            },
          ].map(section => (
            <div key={section.heading}>
              <h2 className="text-lg font-bold text-white mb-2">{section.heading}</h2>
              <p className="text-slate-400 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
