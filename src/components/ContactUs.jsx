import { useState } from 'react'
import ScrollReveal from './ui/ScrollReveal'

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', restaurant: '', city: '', phone: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [shakeFields, setShakeFields] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Enter a valid 10-digit number'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const s = {}
      Object.keys(newErrors).forEach((k) => { s[k] = true })
      setShakeFields(s)
      setTimeout(() => setShakeFields({}), 400)
      return
    }

    setSending(true)
    try {
      const res = await fetch('https://formsubmit.co/ajax/contact.dinedeck@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          Name: formData.name,
          'Restaurant Name': formData.restaurant,
          City: formData.city,
          Phone: formData.phone,
          Email: formData.email,
          Message: formData.message,
          _subject: `DineDeck Enquiry from ${formData.name}`,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch {
      alert('Network error. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  const inputClass = (name) =>
    `w-full px-4 py-3 border-[1.5px] rounded-xl text-sm font-body transition-all focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-indigo-100 ${
      errors[name] ? 'border-red-400' : 'border-slate-200'
    } ${shakeFields[name] ? 'shake' : ''}`

  return (
    <section id="contact" className="py-24 px-6 bg-white">
      <div className="max-w-[700px] mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] text-slate-900 mb-3 font-display">Get In Touch</h2>
            <p className="text-slate-500 text-lg">Have questions? Want a demo? We respond within 2 hours.</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[13px] text-slate-700 mb-1.5 block">Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass('name')} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="font-semibold text-[13px] text-slate-700 mb-1.5 block">Restaurant Name</label>
                  <input type="text" name="restaurant" value={formData.restaurant} onChange={handleChange} className={inputClass('restaurant')} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[13px] text-slate-700 mb-1.5 block">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass('city')} />
                </div>
                <div>
                  <label className="font-semibold text-[13px] text-slate-700 mb-1.5 block">Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass('phone')} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="font-semibold text-[13px] text-slate-700 mb-1.5 block">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass('email')} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="font-semibold text-[13px] text-slate-700 mb-1.5 block">Message / What are you looking for?</label>
                <textarea name="message" rows={4} value={formData.message} onChange={handleChange} className={`${inputClass('message')} resize-y`} />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="glow-btn w-full py-4 bg-brand-orange text-white rounded-[10px] font-bold text-base font-display border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Message →'}
              </button>
            </form>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-emerald-700 font-bold text-lg font-display">Message Sent!</p>
              <p className="text-emerald-600 text-sm mt-1">We'll reach out within 2 hours.</p>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
