# Changelog

All notable changes to VibeScan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete brand identity system
  - VibeScan logo (icon and full wordmark variations)
  - Brand color palette (Teal #14B8A6, Coral #F97316, Purple #8B5CF6)
  - Logo React component with multiple variants
  - Comprehensive brand guidelines in BRAND_IDENTITY.md
- Real VibeScan scanner integration in dashboard
  - Connected CLI scanner to dashboard API via child_process
  - Graceful fallback to mock data if scanner unavailable
  - Real-time issue detection with actual security scores
- Interactive homepage features
  - "Get Started Free" button scrolls to file upload section
  - "View Documentation" button links to GitHub README
  - Stats section with accurate product capabilities
- Improved hero section with gradient branding
- Feature cards with hover animations and color-coded categories

### Changed
- Updated homepage stats from mock usage data to real product features
  - Now shows: Issue Types (20+), Languages (JS/TS), Scan Time (<2s), Open Source (100%)
- Enhanced Tailwind configuration with brand colors
- Improved page layout with proper centering (container mx-auto max-w-7xl)
- Updated CTA copy to be more accurate and actionable

### Fixed
- Next.js webpack module resolution issue when loading scanner
  - Switched from dynamic require to child_process execution
  - Scanner CLI exit code 1 handling (when critical issues found)
- Dashboard layout alignment (content was left-aligned instead of centered)
- Button functionality on homepage (were placeholder buttons)

### Removed
- Mock platform statistics (fake "10,000+ files scanned" data)

## [Previous Versions]

_Note: This changelog was started on 2025-10-18. Previous version history may be incomplete._

---

## How to Update This Changelog

When making changes:

1. **Added** - New features
2. **Changed** - Changes to existing functionality
3. **Deprecated** - Soon-to-be removed features
4. **Removed** - Removed features
5. **Fixed** - Bug fixes
6. **Security** - Vulnerability fixes

When releasing a version:
1. Change `[Unreleased]` to `[Version] - YYYY-MM-DD`
2. Create new `[Unreleased]` section at top
3. Update version in package.json
