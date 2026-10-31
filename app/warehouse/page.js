'use client';
import './warehouse.css';

export default function Warehouse(){
  return <main className="warehouse-shell">
    <header className="warehouse-top">
      <a href="/system">← CTE Online System</a>
      <div>
        <span>OPERATIONS</span>
        <h1>Warehouse</h1>
        <p>Initial framework · inventory module coming next</p>
      </div>
      <div className="warehouse-status">COMING SOON</div>
    </header>

    <section className="warehouse-hero">
      <div>
        <span>WAREHOUSE MANAGEMENT</span>
        <h2>Inventory & Stock Control</h2>
        <p>This module is reserved for CTE warehouse operations. The first production version can connect quotation, invoice and delivery workflows to actual stock.</p>
      </div>
    </section>

    <section className="warehouse-grid">
      {[
        ['Current Inventory','View available stock by product and warehouse.'],
        ['Stock In','Record incoming goods, purchase receipts and arrivals.'],
        ['Stock Out','Record sales, transfers, project allocation and delivery.'],
        ['Serial Numbers','Track inverter, battery and equipment serial numbers.'],
        ['Reserved Stock','Reserve products for accepted quotations or paid orders.'],
        ['Warehouse History','Audit stock changes and responsible staff.']
      ].map(([title,desc],i)=><div className="warehouse-card" key={title}>
        <span>{String(i+1).padStart(2,'0')}</span>
        <h3>{title}</h3>
        <p>{desc}</p>
        <b>Planned</b>
      </div>)}
    </section>

    <section className="warehouse-flow">
      <span>PLANNED FLOW</span>
      <div>
        <strong>Quotation Accepted</strong><i>→</i>
        <strong>Reserve Stock</strong><i>→</i>
        <strong>Finance Paid</strong><i>→</i>
        <strong>Stock Out</strong><i>→</i>
        <strong>Delivery</strong>
      </div>
    </section>
  </main>
}