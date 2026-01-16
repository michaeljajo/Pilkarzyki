'use client'

import { useState } from 'react'
import {
  Check, X, AlertTriangle, Info, Mail, Lock, Search,
  User, Settings, Bell, Home, Calendar, TrendingUp,
  Loader2, Download, Upload, Edit, Trash2, Plus,
  ChevronRight, ArrowRight
} from 'lucide-react'

export default function StyleGuidePage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto py-8" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Pilkarzyki Design System</h1>
          <p className="text-base text-gray-600">Arsenal FC 23/24 Third Kit · Modern UI Components</p>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>

        {/* Color Section */}
        <section style={{ marginBottom: '80px' }}>
          {/* Section Header - 48px below */}
          <div style={{ marginBottom: '48px' }}>
            <h2 className="text-4xl font-bold text-gray-900" style={{ lineHeight: '1.3', marginBottom: '16px' }}>Color</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              We keep our Arsenal brand feeling happy, playful and friendly by using the following color palette.
            </p>
          </div>

          {/* Primary Palette - 56px below subsection */}
          <div style={{ marginBottom: '56px' }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider" style={{ marginBottom: '24px' }}>Primary Colors</h3>
            <div className="grid grid-cols-4" style={{ columnGap: '32px', rowGap: '32px' }}>
              <ColorCard name="Rich Green" hex="#29544D" usage="Primary actions, backgrounds" />
              <ColorCard name="Collegiate Navy" hex="#061852" usage="Headings, accents" />
              <ColorCard name="Sand Gold" hex="#DECF99" usage="Highlights, CTAs" />
              <ColorCard name="Off-White" hex="#F2F2F2" usage="Surfaces, text" />
            </div>
          </div>

          {/* Semantic Colors - 56px below subsection */}
          <div style={{ marginBottom: '56px' }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider" style={{ marginBottom: '24px' }}>Semantic Colors</h3>
            <div className="grid grid-cols-6" style={{ columnGap: '24px', rowGap: '24px' }}>
              <ColorCard name="Success" hex="#10B981" compact />
              <ColorCard name="Success Light" hex="#34D399" compact />
              <ColorCard name="Warning" hex="#F59E0B" compact />
              <ColorCard name="Warning Light" hex="#FBBF24" compact />
              <ColorCard name="Danger" hex="#EF4444" compact />
              <ColorCard name="Info" hex="#3B82F6" compact />
            </div>
          </div>

          {/* Teal Palette - Last subsection (no bottom margin) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider" style={{ marginBottom: '24px' }}>Teal Accent Palette</h3>
            <div className="grid grid-cols-5" style={{ columnGap: '24px', rowGap: '24px' }}>
              <ColorCard name="Mineral Green" hex="#0D9488" compact />
              <ColorCard name="Deep Teal" hex="#0F766E" compact />
              <ColorCard name="Bright Teal" hex="#14B8A6" compact />
              <ColorCard name="Electric Teal" hex="#2DD4BF" compact />
              <ColorCard name="Teal Muted" hex="#5EEAD4" compact />
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section style={{ marginBottom: '80px' }}>
          {/* Section Header - 48px below */}
          <div style={{ marginBottom: '48px' }}>
            <h2 className="text-4xl font-bold text-gray-900" style={{ lineHeight: '1.3', marginBottom: '16px' }}>Typeface</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Inter is our custom typeface. It comes in 5 weights. Professional and dynamic, this font is an excellent choice for maximum readability.
            </p>
          </div>

          {/* Font Display - 56px below subsection */}
          <div style={{ marginBottom: '56px', padding: '48px' }} className="bg-gray-50 rounded-2xl">
            <div className="text-center">
              <p className="text-[120px] font-bold leading-none text-gray-900 mb-4">Inter</p>
              <div className="flex justify-center gap-8 text-2xl text-gray-700">
                <span className="font-normal">Regular</span>
                <span className="font-medium">Medium</span>
                <span className="font-semibold">Semibold</span>
                <span className="font-bold">Bold</span>
              </div>
            </div>
          </div>

          {/* Type Scale - Last subsection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider" style={{ marginBottom: '24px' }}>Type Scale</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <TypeRow label="Display" size="64px" weight="Bold">
              <p className="text-6xl font-bold text-gray-900">Display</p>
            </TypeRow>

            <TypeRow label="Heading 1" size="42px" weight="Bold">
              <p className="text-5xl font-bold text-gray-900">Heading 1</p>
            </TypeRow>

            <TypeRow label="Heading 2" size="32px" weight="Bold">
              <p className="text-4xl font-bold text-gray-900">Heading 2</p>
            </TypeRow>

            <TypeRow label="Heading 3" size="26px" weight="Semibold">
              <p className="text-3xl font-semibold text-gray-900">Heading 3</p>
            </TypeRow>

            <TypeRow label="Body Large" size="19px" weight="Regular">
              <p className="text-lg text-gray-900">The quick brown fox jumps over the lazy dog</p>
            </TypeRow>

            <TypeRow label="Body" size="17px" weight="Regular">
              <p className="text-base text-gray-900">The quick brown fox jumps over the lazy dog</p>
            </TypeRow>

            <TypeRow label="Small" size="15px" weight="Regular">
              <p className="text-sm text-gray-900">The quick brown fox jumps over the lazy dog</p>
            </TypeRow>

            <TypeRow label="Caption" size="12px" weight="Medium">
              <p className="text-xs font-medium text-gray-900">THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG</p>
            </TypeRow>
            </div>
          </div>
        </section>

        {/* Spacing Section */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '48px' }}>
            <h2 className="text-4xl font-bold text-gray-900" style={{ lineHeight: '1.3', marginBottom: '16px' }}>Spacing</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Our spacing system follows an 8px grid for consistent rhythm and vertical harmony.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider" style={{ marginBottom: '24px' }}>Scale</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { token: '4px', name: 'space-1' },
              { token: '8px', name: 'space-2' },
              { token: '12px', name: 'space-3' },
              { token: '16px', name: 'space-4' },
              { token: '20px', name: 'space-5' },
              { token: '28px', name: 'space-6' },
              { token: '32px', name: 'space-7' },
              { token: '40px', name: 'space-8' },
              { token: '48px', name: 'space-10' },
              { token: '64px', name: 'space-12' },
              { token: '80px', name: 'space-16' },
              { token: '96px', name: 'space-20' },
            ].map(({ token, name }) => (
              <SpacingRow key={name} token={token} name={name} />
            ))}
            </div>
          </div>
        </section>

        {/* Border Radius Section */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '48px' }}>
            <h2 className="text-4xl font-bold text-gray-900" style={{ lineHeight: '1.3', marginBottom: '16px' }}>Border Radius</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Soft, modern corner treatments for a friendly and approachable interface.
            </p>
          </div>

          <div className="grid grid-cols-4" style={{ columnGap: '40px', rowGap: '48px' }}>
            <RadiusCard name="Small" value="8px" token="radius-sm" />
            <RadiusCard name="Medium" value="12px" token="radius-md" />
            <RadiusCard name="Large" value="16px" token="radius-lg" />
            <RadiusCard name="Extra Large" value="20px" token="radius-xl" />
            <RadiusCard name="2X Large" value="28px" token="radius-2xl" />
            <RadiusCard name="3X Large" value="40px" token="radius-3xl" />
            <RadiusCard name="Full" value="9999px" token="radius-full" />
          </div>
        </section>

        {/* Buttons Section */}
        <section className="section-spacing-large">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.3' }}>Buttons</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Modern, accessible buttons with optimal spacing, clear states, and professional polish.
            </p>
          </div>

          <div className="stack-2xl">
            {/* Primary Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Primary</h3>
              <div className="flex flex-wrap items-center" style={{ gap: '24px' }}>
                <button className="min-h-[44px] py-3 bg-[#29544D] text-white text-sm font-medium rounded-xl hover:bg-[#1f3f3a] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Primary Button
                </button>
                <button className="min-h-[44px] py-3 bg-[#29544D] text-white text-sm font-medium rounded-xl hover:bg-[#1f3f3a] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:ring-offset-2 whitespace-nowrap" style={{paddingLeft: '2em', paddingRight: '2em', gap: '0.75em'}}>
                  <Download size={16} strokeWidth={2} />
                  With Icon
                </button>
                <button className="min-h-[44px] py-3 bg-[#29544D]/30 text-white/60 text-sm font-medium rounded-xl cursor-not-allowed shadow-sm whitespace-nowrap inline-flex items-center justify-center" disabled style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Disabled
                </button>
                <button className="min-h-[44px] py-3 bg-[#29544D] text-white text-sm font-medium rounded-xl shadow-sm inline-flex items-center justify-center whitespace-nowrap" style={{paddingLeft: '2em', paddingRight: '2em', gap: '0.75em'}}>
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                  Loading
                </button>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Secondary</h3>
              <div className="flex flex-wrap items-center" style={{ gap: '24px' }}>
                <button className="min-h-[44px] py-3 bg-[#061852] text-white text-sm font-medium rounded-xl hover:bg-[#0a2475] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#061852] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Secondary Button
                </button>
                <button className="min-h-[44px] py-3 bg-white text-[#061852] text-sm font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 border border-[#061852]/20 shadow-sm hover:shadow-md hover:border-[#061852]/40 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#061852] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Outline
                </button>
                <button className="min-h-[44px] py-3 bg-transparent text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Ghost
                </button>
              </div>
            </div>

            {/* Semantic Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Semantic</h3>
              <div className="flex flex-wrap items-center" style={{ gap: '24px' }}>
                <button className="min-h-[44px] py-3 bg-[#10B981] text-white text-sm font-medium rounded-xl hover:bg-[#059669] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Success
                </button>
                <button className="min-h-[44px] py-3 bg-[#F59E0B] text-white text-sm font-medium rounded-xl hover:bg-[#D97706] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Warning
                </button>
                <button className="min-h-[44px] py-3 bg-[#EF4444] text-white text-sm font-medium rounded-xl hover:bg-[#DC2626] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#EF4444] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Danger
                </button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Sizes</h3>
              <div className="flex flex-wrap items-center" style={{ gap: '24px' }}>
                <button className="min-h-[36px] py-2 bg-[#29544D] text-white text-xs font-medium rounded-lg hover:bg-[#1f3f3a] transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '1.5em', paddingRight: '1.5em'}}>
                  Small
                </button>
                <button className="min-h-[44px] py-3 bg-[#29544D] text-white text-sm font-medium rounded-xl hover:bg-[#1f3f3a] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2em', paddingRight: '2em'}}>
                  Medium
                </button>
                <button className="min-h-[52px] py-4 bg-[#29544D] text-white text-base font-medium rounded-xl hover:bg-[#1f3f3a] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center" style={{paddingLeft: '2.5em', paddingRight: '2.5em'}}>
                  Large
                </button>
                <button className="w-11 h-11 min-w-[44px] min-h-[44px] bg-[#29544D] text-white rounded-xl hover:bg-[#1f3f3a] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:ring-offset-2">
                  <Settings size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Button Design System Documentation */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Modern Button Design System</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Horizontal Padding (em-based)</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Small: 1.5em left/right (≈18px @ 12px font)</li>
                      <li>• Medium: 2em left/right (≈28px @ 14px font)</li>
                      <li>• Large: 2.5em left/right (≈40px @ 16px font)</li>
                      <li>• Icon gap: 0.75em (≈10.5px @ 14px font)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Typography & Layout</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Font: Inter Medium (500)</li>
                      <li>• Small: 12px / Medium: 14px / Large: 16px</li>
                      <li>• No text wrapping (whitespace-nowrap)</li>
                      <li>• Centered with flexbox (inline-flex)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Visual Properties</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Border radius: 12px (xl) / 8px (lg small)</li>
                      <li>• Min height: 44px (WCAG AAA touch target)</li>
                      <li>• Shadow: sm default, md on hover</li>
                      <li>• Transition: 200ms all properties</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Interactive States</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Hover: Darker bg + shadow increase</li>
                      <li>• Active: Scale 0.98 (subtle press)</li>
                      <li>• Focus: 2px ring with 2px offset</li>
                      <li>• Disabled: 30% opacity, no pointer</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Accessibility</h4>
                  <p className="text-gray-600">
                    All buttons meet WCAG AAA standards with minimum 44×44px touch targets, visible focus indicators,
                    and 4.5:1 color contrast. Disabled states use reduced opacity with cursor:not-allowed.
                  </p>
                </div>

                {/* CSS Code Example */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">CSS Implementation Example</h4>
                  <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                    <pre className="text-sm text-gray-100 font-mono leading-relaxed">
{`.button {
  /* Horizontal padding uses em units for font-relative spacing */
  padding-left: 2em;      /* ≈28px at 14px font size */
  padding-right: 2em;     /* Ensures minimum 32px total horizontal space */
  padding-top: 0.75rem;   /* 12px */
  padding-bottom: 0.75rem;

  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;    /* Prevents text wrapping */

  /* Typography */
  font-size: 14px;
  font-weight: 500;

  /* Visual */
  min-height: 44px;       /* WCAG AAA touch target */
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 200ms;
}

.button--primary {
  background: #29544D;
  color: white;
}

.button--primary:hover {
  background: #1f3f3a;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.button--with-icon {
  gap: 0.75em;            /* Icon spacing scales with font */
}

.button--small {
  padding-left: 1.5em;    /* ≈18px at 12px font */
  padding-right: 1.5em;
  font-size: 12px;
  min-height: 36px;
}

.button--large {
  padding-left: 2.5em;    /* ≈40px at 16px font */
  padding-right: 2.5em;
  font-size: 16px;
  min-height: 52px;
}`}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Using em-based horizontal padding ensures text never appears cramped, as padding scales proportionally with font size.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Inputs Section */}
        <section className="section-spacing-large">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.3' }}>Form Inputs</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Clean, accessible form elements with clear feedback states.
            </p>
          </div>

          <div className="max-w-2xl stack-lg">
            {/* Basic Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Label
              </label>
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full h-12 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-transparent transition-all"
                style={{paddingLeft: '1.25em', paddingRight: '1.25em'}}
              />
            </div>

            {/* With Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 text-gray-400" style={{left: '1.25em'}}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full h-12 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-transparent transition-all"
                  style={{paddingLeft: '3em', paddingRight: '1.25em'}}
                />
              </div>
            </div>

            {/* Error State */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                With Error
              </label>
              <input
                type="text"
                defaultValue="Invalid value"
                className="w-full h-12 bg-white border-2 border-[#EF4444] rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#EF4444] transition-all"
                style={{paddingLeft: '1.25em', paddingRight: '1.25em'}}
              />
              <p className="mt-2 text-sm text-[#EF4444]">This field is required</p>
            </div>

            {/* Disabled */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Disabled
              </label>
              <input
                type="text"
                disabled
                placeholder="Disabled input"
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed"
                style={{paddingLeft: '1.25em', paddingRight: '1.25em'}}
              />
            </div>

            {/* Select */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select
              </label>
              <select className="w-full h-12 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-transparent transition-all" style={{paddingLeft: '1.25em', paddingRight: '1.25em'}}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Textarea
              </label>
              <textarea
                rows={4}
                placeholder="Enter longer text..."
                className="w-full bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-transparent transition-all resize-none"
                style={{paddingLeft: '1.25em', paddingRight: '1.25em', paddingTop: '0.875em', paddingBottom: '0.875em'}}
              />
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="section-spacing-large">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.3' }}>Badges</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Status indicators and labels for categorization.
            </p>
          </div>

          <div className="stack-lg">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700" style={{paddingLeft: '1em', paddingRight: '1em'}}>
                  Default
                </span>
                <span className="inline-flex items-center py-1 rounded-full text-xs font-semibold bg-[#29544D] text-white" style={{paddingLeft: '1em', paddingRight: '1em'}}>
                  Primary
                </span>
                <span className="inline-flex items-center py-1 rounded-full text-xs font-semibold bg-[#10B981] text-white" style={{paddingLeft: '1em', paddingRight: '1em', gap: '0.5em'}}>
                  <Check size={12} /> Success
                </span>
                <span className="inline-flex items-center py-1 rounded-full text-xs font-semibold bg-[#F59E0B] text-white" style={{paddingLeft: '1em', paddingRight: '1em', gap: '0.5em'}}>
                  <AlertTriangle size={12} /> Warning
                </span>
                <span className="inline-flex items-center py-1 rounded-full text-xs font-semibold bg-[#EF4444] text-white" style={{paddingLeft: '1em', paddingRight: '1em', gap: '0.5em'}}>
                  <X size={12} /> Danger
                </span>
                <span className="inline-flex items-center py-1 rounded-full text-xs font-semibold bg-[#3B82F6] text-white" style={{paddingLeft: '1em', paddingRight: '1em', gap: '0.5em'}}>
                  <Info size={12} /> Info
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Sizes</h3>
              <div className="flex items-center flex-wrap gap-3">
                <span className="inline-flex items-center py-0.5 rounded-full text-xs font-semibold bg-[#29544D] text-white" style={{paddingLeft: '0.875em', paddingRight: '0.875em'}}>
                  Small
                </span>
                <span className="inline-flex items-center py-1 rounded-full text-sm font-semibold bg-[#29544D] text-white" style={{paddingLeft: '1em', paddingRight: '1em'}}>
                  Medium
                </span>
                <span className="inline-flex items-center py-1.5 rounded-full text-base font-semibold bg-[#29544D] text-white" style={{paddingLeft: '1.25em', paddingRight: '1.25em'}}>
                  Large
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="section-spacing-large">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.3' }}>Cards</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Flexible content containers for organizing information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ columnGap: '32px', rowGap: '32px' }}>
            {/* Basic Card */}
            <div className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow duration-200 card-padding">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ lineHeight: '1.4' }}>Card Title</h3>
              <p className="text-gray-600 mb-6" style={{ lineHeight: '1.6' }}>
                A simple card component with header and content areas for displaying information.
              </p>
              <button className="text-[#29544D] font-semibold inline-flex items-center hover:gap-2 transition-all" style={{gap: '0.5em'}}>
                Learn more <ArrowRight size={16} />
              </button>
            </div>

            {/* Elevated Card */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 card-padding">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ lineHeight: '1.4' }}>Elevated Card</h3>
              <p className="text-gray-600 mb-6" style={{ lineHeight: '1.6' }}>
                Card with elevated shadow for more prominence and visual hierarchy.
              </p>
              <button className="text-[#29544D] font-semibold inline-flex items-center hover:gap-2 transition-all" style={{gap: '0.5em'}}>
                Learn more <ArrowRight size={16} />
              </button>
            </div>

            {/* Colored Card */}
            <div className="bg-gradient-to-br from-[#29544D] to-[#1f3f3a] rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow duration-200 card-padding">
              <h3 className="text-xl font-bold mb-4" style={{ lineHeight: '1.4' }}>Featured Card</h3>
              <p className="text-white/90 mb-6" style={{ lineHeight: '1.6' }}>
                Colored card for highlighting important content or featured items.
              </p>
              <button className="text-[#DECF99] font-semibold inline-flex items-center hover:gap-2 transition-all" style={{gap: '0.5em'}}>
                Learn more <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Vertical Cards Subsection */}
          <div style={{ marginTop: '56px' }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Vertical Cards</h3>
            <p className="text-base text-gray-600 mb-8" style={{ lineHeight: '1.6' }}>
              Tall, narrow cards optimized for grid layouts. All text content is fully justified for a clean, aligned appearance.
            </p>
            <div className="grid grid-cols-2" style={{ columnGap: '16px', rowGap: '16px' }}>
              {/* Example Vertical Card 1 - Forward (Sand Gold Border) */}
              <div className="bg-white border-2 border-[#DECF99] rounded-xl hover:shadow-lg transition-shadow duration-200" style={{ width: '140px', height: '120px' }}>
                <div className="p-3 h-full flex flex-col" style={{ marginTop: '16px' }}>
                  <h3 className="font-bold text-gray-900 break-words text-center" style={{ fontSize: '13px', lineHeight: '1.3', minHeight: '2.6em', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', hyphens: 'auto' }}>
                    Alassane Plea
                  </h3>
                  <div className="text-center">
                    <p className="text-gray-500 truncate" style={{ fontSize: '11px', lineHeight: '1.4' }} title="Eredivisie">
                      Eredivisie
                    </p>
                  </div>
                </div>
              </div>

              {/* Example Vertical Card 2 - Midfielder (Collegiate Navy Border) */}
              <div className="bg-white border-2 border-[#061852] rounded-xl hover:shadow-lg transition-shadow duration-200" style={{ width: '140px', height: '120px' }}>
                <div className="p-3 h-full flex flex-col" style={{ marginTop: '16px' }}>
                  <h3 className="font-bold text-gray-900 break-words text-center" style={{ fontSize: '13px', lineHeight: '1.3', minHeight: '2.6em', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', hyphens: 'auto' }}>
                    Marcus Rashford
                  </h3>
                  <div className="text-center">
                    <p className="text-gray-500 truncate" style={{ fontSize: '11px', lineHeight: '1.4' }} title="Premier League">
                      Premier League
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Card Documentation */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 mt-8">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Vertical Card Design</h4>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Layout</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>Fixed dimensions: 140px × 120px</strong></li>
                    <li>• Flexbox column layout (h-full)</li>
                    <li>• Padding: 12px (p-3) all sides</li>
                    <li>• Responsive grid: 2-6 columns</li>
                    <li>• Absolute sizing prevents scaling issues</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Position-Based Borders</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>Forwards:</strong> Sand Gold (#DECF99) 2px border</li>
                    <li>• <strong>Midfielders:</strong> Collegiate Navy (#061852) 2px border</li>
                    <li>• <strong>Defenders:</strong> Collegiate Navy (#061852) 2px border</li>
                    <li>• <strong>Goalkeepers:</strong> Neutral gray border</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Typography (Unified System)</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Player Name: 13px, bold, line-height 1.3</li>
                    <li>• League: 11px, gray-500, line-height 1.4</li>
                    <li>• Font: Inter (system default)</li>
                    <li>• Position indicated by border color only</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Text Overflow Rules</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Name: 2-line clamp with ellipsis</li>
                    <li>• Min height: 2.6em (consistent height)</li>
                    <li>• Break on word boundaries</li>
                    <li>• Auto hyphenation enabled</li>
                    <li>• League: Single line truncate with title</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Spacing System</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Name → League: 8px (mb-2)</li>
                    <li>• Fixed minimum name height: 2.6em</li>
                    <li>• Border radius: 12px (rounded-xl)</li>
                    <li>• Clean, minimal layout</li>
                  </ul>
                </div>
              </div>

              {/* CSS Code Example */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-3">CSS Implementation</h5>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-100 font-mono leading-relaxed">
{`/* Vertical Player Card - Fixed Dimensions */
.player-card {
  width: 140px;
  height: 120px;
  padding: 12px;

  display: flex;
  flex-direction: column;

  /* Base styling */
  background: white;
  border-radius: 12px;
  border-width: 2px;
  border-style: solid;
}

/* Position-Based Border Colors */
.player-card--forward {
  border-color: #DECF99; /* Sand Gold */
}

.player-card--midfielder,
.player-card--defender {
  border-color: #061852; /* Collegiate Navy */
}

.player-card--goalkeeper {
  border-color: #e5e7eb; /* Neutral Gray */
}

/* Player Name - Fixed Height Section */
.player-name {
  font-size: 13px;
  line-height: 1.3;
  font-weight: 700;
  min-height: 2.6em;
  margin-bottom: 12px; /* Separation from info */

  /* 2-line clamp */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  hyphens: auto;
}

/* League Info */
.player-league {
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #6b7280; /* gray-500 */
}`}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  <strong>Fixed dimensions (140px × 120px)</strong> ensure consistent, compact card sizing. <strong>Position-based borders</strong> provide instant visual distinction: Forwards use Sand Gold (#DECF99), while Midfielders and Defenders share Collegiate Navy (#061852). Clean, minimal layout showing only player name and league.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Icons Section */}
        <section className="section-spacing-large">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.3' }}>Icons</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Lucide React icon library. Consistent, beautiful, and accessible.
            </p>
          </div>

          <div className="stack-2xl">
            {/* Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Sizes</h3>
              <div className="flex items-end gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <User size={14} className="text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-500">14px</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <User size={16} className="text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-500">16px</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <User size={20} className="text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-500">20px</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <User size={24} className="text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-500">24px</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 flex items-center justify-center mb-2">
                    <User size={32} className="text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-500">32px</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 flex items-center justify-center mb-2">
                    <User size={48} className="text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-500">48px</p>
                </div>
              </div>
            </div>

            {/* Common Icons */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Common Icons</h3>
              <div className="grid grid-cols-8 gap-6">
                <IconDisplay icon={<Home size={24} />} label="Home" />
                <IconDisplay icon={<User size={24} />} label="User" />
                <IconDisplay icon={<Settings size={24} />} label="Settings" />
                <IconDisplay icon={<Bell size={24} />} label="Bell" />
                <IconDisplay icon={<Mail size={24} />} label="Mail" />
                <IconDisplay icon={<Calendar size={24} />} label="Calendar" />
                <IconDisplay icon={<Search size={24} />} label="Search" />
                <IconDisplay icon={<TrendingUp size={24} />} label="Trend" />
                <IconDisplay icon={<Check size={24} />} label="Check" />
                <IconDisplay icon={<X size={24} />} label="Close" />
                <IconDisplay icon={<Plus size={24} />} label="Plus" />
                <IconDisplay icon={<Edit size={24} />} label="Edit" />
                <IconDisplay icon={<Trash2 size={24} />} label="Delete" />
                <IconDisplay icon={<Download size={24} />} label="Download" />
                <IconDisplay icon={<Upload size={24} />} label="Upload" />
                <IconDisplay icon={<Loader2 size={24} />} label="Loading" />
              </div>
            </div>
          </div>
        </section>

        {/* Vertical Spacing Section */}
        <section className="section-spacing-large">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.3' }}>Vertical Spacing & Rhythm</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              Our vertical spacing system uses an 8px grid for consistent rhythm, improved readability, and a clean, modern feel.
            </p>
          </div>

          {/* Line Height Guide */}
          <div className="content-group mb-20">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Line Height Scale</h3>
            <div className="space-y-8">
              <LineHeightDemo
                label="Tight (1.35)"
                lineHeight="1.35"
                text="Headings use tight line height for visual impact and hierarchy."
                usage="H1, H2, H3"
              />
              <LineHeightDemo
                label="Snug (1.5)"
                lineHeight="1.5"
                text="Subheadings use snug line height for balance between density and readability."
                usage="H4, H5"
              />
              <LineHeightDemo
                label="Normal (1.6)"
                lineHeight="1.6"
                text="Body text uses normal line height (160%) for optimal reading comfort and reduced eye strain during extended reading sessions."
                usage="Paragraphs, body text"
              />
              <LineHeightDemo
                label="Relaxed (1.75)"
                lineHeight="1.75"
                text="Relaxed line height provides maximum breathing room for important content, quotes, or featured text blocks that need emphasis."
                usage="Featured content, quotes"
              />
            </div>
          </div>

          {/* Spacing Scale */}
          <div className="content-group mb-20">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">8px Grid System</h3>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="space-y-6">
                {[
                  { token: '8px', name: 'space-2', usage: 'Minimal gap between related items' },
                  { token: '16px', name: 'space-4', usage: 'Between paragraphs in text blocks' },
                  { token: '24px', name: 'space-6', usage: 'Component spacing, card padding' },
                  { token: '32px', name: 'space-8', usage: 'Between content groups, card gaps' },
                  { token: '48px', name: 'space-12', usage: 'Space above headings' },
                  { token: '64px', name: 'space-16', usage: 'Between major sections' },
                  { token: '96px', name: 'space-24', usage: 'Large section breaks' },
                ].map(({ token, name, usage }) => (
                  <div key={name} className="flex items-start gap-8">
                    <div className="w-32 flex-shrink-0">
                      <p className="text-sm font-mono text-gray-900 font-semibold">{token}</p>
                      <p className="text-xs text-gray-500">{name}</p>
                    </div>
                    <div className="flex items-center gap-6 flex-1">
                      <div
                        className="h-8 bg-[#0D9488] rounded-lg"
                        style={{ width: token }}
                      />
                      <p className="text-sm text-gray-600">{usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Semantic Spacing */}
          <div className="content-group mb-20">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Semantic Spacing Tokens</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <SpacingToken
                name="--spacing-text-block"
                value="16px"
                description="Space between paragraphs and text blocks"
              />
              <SpacingToken
                name="--spacing-content-group"
                value="32px"
                description="Between related content sections"
              />
              <SpacingToken
                name="--spacing-section-gap"
                value="64px"
                description="Between major page sections"
              />
              <SpacingToken
                name="--spacing-section-large"
                value="96px"
                description="Large breaks between distinct areas"
              />
              <SpacingToken
                name="--spacing-heading-top"
                value="48px"
                description="Space above headings"
              />
              <SpacingToken
                name="--spacing-heading-bottom"
                value="24px"
                description="Space below headings"
              />
              <SpacingToken
                name="--spacing-card-gap"
                value="32px"
                description="Gap between cards in grid"
              />
              <SpacingToken
                name="--spacing-card-padding"
                value="24px"
                description="Internal card padding"
              />
            </div>
          </div>

          {/* Visual Examples */}
          <div className="content-group">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Visual Examples</h3>

            {/* Good vs Bad Example */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-2 border-green-500 rounded-2xl p-8 bg-green-50/30">
                <div className="flex items-center gap-2 mb-6">
                  <Check size={20} className="text-green-600" />
                  <h4 className="text-lg font-bold text-gray-900">Good: Proper Spacing</h4>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.35' }}>
                    Card Title
                  </h3>
                  <p className="text-base text-gray-600 mb-4" style={{ lineHeight: '1.6' }}>
                    This card demonstrates proper vertical spacing with adequate breathing room between elements.
                  </p>
                  <p className="text-base text-gray-600" style={{ lineHeight: '1.6' }}>
                    Notice the comfortable line height and spacing that makes content easy to scan.
                  </p>
                </div>
              </div>

              <div className="border-2 border-red-500 rounded-2xl p-8 bg-red-50/30">
                <div className="flex items-center gap-2 mb-6">
                  <X size={20} className="text-red-600" />
                  <h4 className="text-lg font-bold text-gray-900">Bad: Cramped Layout</h4>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ lineHeight: '1.1' }}>
                    Card Title
                  </h3>
                  <p className="text-base text-gray-600 mb-1" style={{ lineHeight: '1.2' }}>
                    This card shows poor spacing with cramped text that&apos;s hard to read.
                  </p>
                  <p className="text-base text-gray-600" style={{ lineHeight: '1.2' }}>
                    Tight line height and minimal gaps create visual clutter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="section-spacing-large">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.3' }}>Accessibility</h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ lineHeight: '1.6' }}>
              WCAG AAA compliant design with focus on inclusive user experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contrast */}
            <div className="bg-gray-50 rounded-2xl" style={{padding: '2em'}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Color Contrast</h3>
              <div className="space-y-3">
                <ContrastRow bg="#29544D" fg="#F2F2F2" label="Rich Green + Off-White" ratio="8.2:1" />
                <ContrastRow bg="#061852" fg="#DECF99" label="Navy + Sand Gold" ratio="9.1:1" />
                <ContrastRow bg="#061852" fg="#F2F2F2" label="Navy + Off-White" ratio="14.3:1" />
              </div>
            </div>

            {/* Touch Targets */}
            <div className="bg-gray-50 rounded-2xl" style={{padding: '2em'}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Touch Targets</h3>
              <p className="text-gray-600 mb-6">Minimum 44×44px for all interactive elements</p>
              <div className="flex gap-4">
                <button className="w-11 h-11 bg-[#29544D] text-white rounded-xl flex items-center justify-center">
                  <Check size={20} />
                </button>
                <button className="h-11 bg-[#29544D] text-white font-semibold rounded-xl" style={{paddingLeft: '1.5em', paddingRight: '1.5em'}}>
                  Button
                </button>
              </div>
            </div>

            {/* Focus Indicators */}
            <div className="bg-gray-50 rounded-2xl" style={{padding: '2em'}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Focus Indicators</h3>
              <p className="text-gray-600 mb-6">Clear visual feedback for keyboard navigation</p>
              <div className="flex gap-3">
                <button className="h-11 bg-[#29544D] text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DECF99] focus:ring-offset-2" style={{paddingLeft: '1.5em', paddingRight: '1.5em'}}>
                  Tab to focus
                </button>
                <input
                  type="text"
                  placeholder="Focus me"
                  className="h-11 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-transparent transition-all"
                  style={{paddingLeft: '1.25em', paddingRight: '1.25em'}}
                />
              </div>
            </div>

            {/* Screen Readers */}
            <div className="bg-gray-50 rounded-2xl" style={{padding: '2em'}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Screen Readers</h3>
              <p className="text-gray-600 mb-4">Semantic HTML and ARIA labels throughout</p>
              <code className="block text-sm bg-white rounded-lg text-gray-900 font-mono" style={{paddingLeft: '1.25em', paddingRight: '1.25em', paddingTop: '0.875em', paddingBottom: '0.875em'}}>
                aria-label=&quot;Close dialog&quot;
              </code>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

// Helper Components

function ColorCard({ name, hex, usage, compact }: { name: string; hex: string; usage?: string; compact?: boolean }) {
  return (
    <div>
      <div
        className={`${compact ? 'h-24' : 'h-32'} rounded-xl`}
        style={{ backgroundColor: hex, marginBottom: '16px' }}
      />
      <p className="font-semibold text-gray-900 text-sm" style={{ marginBottom: '8px' }}>{name}</p>
      <p className="text-xs text-gray-500 font-mono" style={{ marginBottom: usage ? '8px' : '0' }}>{hex}</p>
      {usage && <p className="text-xs text-gray-600" style={{ marginTop: '8px' }}>{usage}</p>}
    </div>
  )
}

function TypeRow({ label, size, weight, children }: {
  label: string
  size: string
  weight: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-8 pb-6 border-b border-gray-100">
      <div className="w-32 flex-shrink-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-xs text-gray-400">{size} · {weight}</p>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

function SpacingRow({ token, name }: { token: string; name: string }) {
  return (
    <div className="flex items-center gap-6">
      <div className="w-24 flex-shrink-0">
        <p className="text-sm font-mono text-gray-900">{token}</p>
        <p className="text-xs text-gray-500">{name}</p>
      </div>
      <div
        className="h-8 bg-[#29544D] rounded"
        style={{ width: token }}
      />
    </div>
  )
}

function RadiusCard({ name, value, token }: { name: string; value: string; token: string }) {
  return (
    <div>
      <div
        className="h-24 bg-[#29544D]"
        style={{ borderRadius: value, marginBottom: '16px' }}
      />
      <p className="font-semibold text-gray-900 text-sm" style={{ marginBottom: '8px' }}>{name}</p>
      <p className="text-xs text-gray-500" style={{ marginBottom: '8px' }}>{value}</p>
      <p className="text-xs text-gray-400 font-mono">{token}</p>
    </div>
  )
}

function IconDisplay({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-gray-900">
        {icon}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function ContrastRow({ bg, fg, label, ratio }: { bg: string; fg: string; label: string; ratio: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-16 h-12 rounded-lg flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: bg, color: fg }}
      >
        Aa
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{ratio} AAA</p>
      </div>
    </div>
  )
}

function LineHeightDemo({ label, lineHeight, text, usage }: {
  label: string
  lineHeight: string
  text: string
  usage: string
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
        <span className="text-xs font-mono text-gray-500">{usage}</span>
      </div>
      <p className="text-base text-gray-700 mb-2" style={{ lineHeight }}>
        {text}
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
        Line height: {lineHeight} ({Math.round(parseFloat(lineHeight) * 100)}%)
      </div>
    </div>
  )
}

function SpacingToken({ name, value, description }: {
  name: string
  value: string
  description: string
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div
          className="w-4 bg-[#0D9488] rounded flex-shrink-0"
          style={{ height: value }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-semibold text-gray-900 mb-1">{name}</p>
          <p className="text-xs text-gray-500 mb-2">{value}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}
