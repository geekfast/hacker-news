import React from 'react';

export default function Header() {
  return (
    <header className="bg-card-background p-4 flex justify-between items-center border-b border-card-border">
      <div className="text-2xl font-bold">Hacker News</div>
      <nav>
        <a href="#" className="text-link-color hover:underline mr-4">New</a>
        <a href="#" className="text-link-color hover:underline mr-4">Past</a>
        <a href="#" className="text-link-color hover:underline mr-4">Comments</a>
        <a href="#" className="text-link-color hover:underline mr-4">Ask</a>
        <a href="#" className="text-link-color hover:underline mr-4">Show</a>
        <a href="#" className="text-link-color hover:underline">Jobs</a>
      </nav>
    </header>
  );
}
