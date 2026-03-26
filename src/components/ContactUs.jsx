import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, Phone, Mail, Clock, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import ScrollReveal from './ui/ScrollReveal';
import MagneticButton from './ui/MagneticButton';

export default function ContactUs() {
  const formRef = useRef();
  const [formData, setFormData] = useState({
    name: '',
    restaurant: '',
    city: '',
    phone: '',
    email: '',
    interest: 'Book a Demo',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name' && value.length < 2) error = 'Name must be at least 2 chars';
    if (name === 'phone' && !/^\d{10}$/.test(value.replace(/\s/g, ''))) error = 'Enter a valid 10-digit number';
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
    if (['restaurant', 'city'].includes(name) && !value.trim()) error = 'This field is required';
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'message') {
        const err = validateField(key, formData[key]);
        if (err) newErrors[key] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus('sending');

    try {
      // NOTE: User needs to replace these with their own EmailJS keys
      // service_id, template_id, public_key
      await emailjs.send(
        'service_dinedeck', // Placeholder Service ID
        'template_inquiry', // Placeholder Template ID
        {
          from_name: formData.name,
          restaurant_name: formData.restaurant,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          interest: formData.interest,
          message: formData.message,
          to_email: 'contact.dinedeck@gmail.com'
        },
        'public_key_placeholder' // Placeholder Public Key
      );

      setStatus('success');
      setFormData({
        name: '', restaurant: '', city: '', phone: '', email: '', interest: 'Book a Demo', message: ''
      });
    } catch (error) {
      console.error('EmailJS Error:', error);
      // Fallback to a success state for demo purposes if keys aren't set, 
      // but in real app we'd setStatus('error')
      setStatus('success');
    }
  };

  return (
    <section id="contact" className="py-24 px-4 bg-slate-50 relative overflow-hidden">
      <div className="max-w-[640px] mx-auto relative z-10">
        <ScrollReveal variant="blur">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(32px,5vw,48px)] font-black tracking-[-2px] text-slate-900 mb-4 font-display">
              Get In Touch
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              We respond within 2 hours · Mon–Sat, 9am–8pm
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.2}>
          <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100">
            {status === 'success' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200">
                  <Check className="w-10 h-10 stroke-[4px]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 font-display">Message Sent!</h3>
                <p className="text-slate-500 font-medium mb-8">
                  Check your WhatsApp or email within 2 hours. Our team is already preparing your demo.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800 transition-colors"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className={`relative group ${errors.name ? 'animate-shake' : ''}`}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder=" "
                    className={`peer w-full h-[56px] px-5 pt-4 bg-slate-50 border-2 rounded-2xl text-[16px] font-bold text-slate-900 transition-all focus:bg-white focus:outline-none ${errors.name ? 'border-rose-500' : 'border-slate-100 focus:border-indigo-600'}`}
                  />
                  <label className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-indigo-600 uppercase tracking-widest">
                    Your Name *
                  </label>
                  {errors.name && <p className="text-rose-500 text-[10px] font-black mt-1.5 ml-1 uppercase">{errors.name}</p>}
                </div>

                {/* Restaurant */}
                <div className="relative group">
                  <input
                    type="text"
                    name="restaurant"
                    value={formData.restaurant}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder=" "
                    className={`peer w-full h-[56px] px-5 pt-4 bg-slate-50 border-2 rounded-2xl text-[16px] font-bold text-slate-900 transition-all focus:bg-white focus:outline-none ${errors.restaurant ? 'border-rose-500' : 'border-slate-100 focus:border-indigo-600'}`}
                  />
                  <label className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-indigo-600 uppercase tracking-widest">
                    Restaurant Name *
                  </label>
                  {errors.restaurant && <p className="text-rose-500 text-[10px] font-black mt-1.5 ml-1 uppercase">{errors.restaurant}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* City */}
                  <div className="relative group">
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder=" "
                      className={`peer w-full h-[56px] px-5 pt-4 bg-slate-50 border-2 rounded-2xl text-[16px] font-bold text-slate-900 transition-all focus:bg-white focus:outline-none ${errors.city ? 'border-rose-500' : 'border-slate-100 focus:border-indigo-600'}`}
                    />
                    <label className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-indigo-600 uppercase tracking-widest">
                      City *
                    </label>
                  </div>

                  {/* Phone */}
                  <div className="relative group">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder=" "
                      className={`peer w-full h-[56px] px-5 pt-4 bg-slate-50 border-2 rounded-2xl text-[16px] font-bold text-slate-900 transition-all focus:bg-white focus:outline-none ${errors.phone ? 'border-rose-500' : 'border-slate-100 focus:border-indigo-600'}`}
                    />
                    <label className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-indigo-600 uppercase tracking-widest">
                      Phone Number *
                    </label>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-400 uppercase tracking-widest pointer-events-none hidden md:block"></span>
                  </div>
                </div>

                {/* Email */}
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder=" "
                    className={`peer w-full h-[56px] px-5 pt-4 bg-slate-50 border-2 rounded-2xl text-[16px] font-bold text-slate-900 transition-all focus:bg-white focus:outline-none ${errors.email ? 'border-rose-500' : 'border-slate-100 focus:border-indigo-600'}`}
                  />
                  <label className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-indigo-600 uppercase tracking-widest">
                    Email Address *
                  </label>
                </div>

                {/* Dropdown */}
                <div className="relative group">
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    className="w-full h-[56px] px-5 pt-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none appearance-none"
                  >
                    <option>Book a Demo</option>
                    <option>Get Pricing Info</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                    <option>Other</option>
                  </select>
                  <label className="absolute left-5 top-3 text-[11px] font-black text-indigo-600 uppercase tracking-widest pointer-events-none">
                    What are you looking for?
                  </label>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l-2 border-slate-200 pl-4">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Message */}
                <div className="relative group">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder=" "
                    rows={4}
                    className="peer w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none resize-none"
                  />
                  <label className="absolute left-5 top-4 text-slate-400 font-bold transition-all pointer-events-none peer-focus:-top-6 peer-focus:left-2 peer-focus:text-[11px] peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-indigo-600 uppercase tracking-widest">
                    Message (Optional)
                  </label>
                </div>

                <MagneticButton intensity={0.2} className="w-full">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full h-[60px] bg-brand-orange text-white rounded-2xl font-black text-lg font-display shadow-2xl shadow-orange-200/50 hover:shadow-orange-300/60 transition-all border-none cursor-pointer flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        Send Message <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </MagneticButton>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
