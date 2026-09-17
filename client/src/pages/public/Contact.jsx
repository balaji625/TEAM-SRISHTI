/**
 * Contact — CarePath AI (Stage 5: polished UI-only form)
 *
 * NOTE: No backend contact endpoint exists yet.
 * The form collects input and validates client-side, but does not submit to any API.
 * A clear message is shown to the user explaining this limitation.
 * Backend contact endpoint will be wired in a later stage.
 */
import { useState } from 'react';
import { Mail, MapPin, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';

const SUBJECTS = [
  'General enquiry',
  'Hospital registration',
  'Professional registration',
  'Technical support',
  'Partnership',
  'Other',
];

const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@carepath.ai',
    sub: 'We aim to respond within 1–2 business days.',
  },
  {
    icon: MapPin,
    label: 'Headquarters',
    value: 'Dublin, Ireland',
    sub: 'European-based healthcare technology platform.',
  },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name    = 'Name is required';
    if (!form.email.trim())   errs.email   = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.subject)        errs.subject = 'Please select a subject';
    if (!form.message.trim()) errs.message = 'Message is required';
    else if (form.message.trim().length < 20) errs.message = 'Message must be at least 20 characters';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    // UI-only: no backend endpoint yet. Show confirmation message.
    setSubmitted(true);
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <MessageSquare className="w-10 h-10 text-blue-600 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Get in touch
          </h1>
          <p className="text-lg text-gray-600">
            Have a question, partnership enquiry, or feedback? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* Contact info */}
            <aside className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Contact information</h2>
                <div className="space-y-5">
                  {CONTACT_INFO.map(({ icon: Icon, label, value, sub }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-blue-600" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note about form being UI-only */}
              <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
                <p>
                  <strong>Note:</strong> The contact form submission backend is not yet active in this version.
                  Submitting the form will show a confirmation message but will not send an email.
                  Please use the email address above to reach us directly.
                </p>
              </div>
            </aside>

            {/* Contact form */}
            <div className="lg:col-span-3">
              {submitted ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-green-50 border border-green-200 rounded-2xl h-full">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" aria-hidden="true" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message received</h3>
                  <p className="text-sm text-gray-600 max-w-sm mb-1">
                    Thank you for getting in touch, <strong>{form.name}</strong>.
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mb-6">
                    Please note: this is a UI demonstration. No message has been sent via email yet.
                    The contact backend will be active in a later release.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-label="Contact form">
                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="name" type="text" name="name" value={form.name} onChange={handleChange}
                        autoComplete="name"
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                        placeholder="Your name"
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="email" type="email" name="email" value={form.email} onChange={handleChange}
                        autoComplete="email"
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                        placeholder="you@example.com"
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="subject" name="subject" value={form.subject} onChange={handleChange}
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subject ? 'border-red-400' : 'border-gray-300'}`}
                      aria-describedby={errors.subject ? 'subject-error' : undefined}
                      aria-invalid={!!errors.subject}
                    >
                      <option value="">Select a subject…</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.subject && <p id="subject-error" className="mt-1 text-xs text-red-600" role="alert">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="message" name="message" value={form.message} onChange={handleChange}
                      rows={5}
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.message ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Tell us how we can help…"
                      aria-describedby={errors.message ? 'message-error' : undefined}
                      aria-invalid={!!errors.message}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.message
                        ? <p id="message-error" className="text-xs text-red-600" role="alert">{errors.message}</p>
                        : <span />
                      }
                      <p className="text-xs text-gray-400">{form.message.length} / 2000</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full sm:w-auto">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
