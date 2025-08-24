# frozen_string_literal: true

source "https://rubygems.org"

# Main theme - updated to latest stable
gem "jekyll-theme-chirpy", "~> 7.3"

# Testing framework - updated to latest
gem "html-proofer", "~> 5.0", group: :test

# Platform-specific dependencies for Windows compatibility
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Standard library gems (Ruby 3.3+ compatibility)
gem "logger", "~> 1.7"
gem "csv", "~> 3.3"  
gem "base64", "~> 0.3"

# Jekyll plugins
gem "jekyll-gist", "~> 1.5"
gem "jekyll-sitemap", "~> 1.4"
gem "jekyll-archives", "~> 2.2"

# Network retry functionality
gem "faraday-retry", "~> 2.3"

# Performance and development gems
group :development do
  gem "rake", "~> 13.0"
end

# Security and maintenance
gem "rexml", "~> 3.4"  # XML parsing security