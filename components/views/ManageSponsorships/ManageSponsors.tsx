'use client';

import React from 'react';

export default function ManageSponsors() {
  const headerStyle =
    'text-xl font-semibold mb-2 text-[#5981F3] group-hover:text-[#000000] transition-colors';

  const rows = [
    { sponsor: '0xa1b2c3d4e5f60123456789abcdefabcdef123456', amount: '5203115221.00', rate: '80%', pending: 841_452.0 },
    { sponsor: '0xb2c3d4e5f60123456789abcdefabcdef123456a1', amount: '3423412982.50', rate: '40%', pending: 328_239.77 },
    { sponsor: '0xc3d4e5f60123456789abcdefabcdef123456a1b2', amount: '9981224875.10', rate: '100%', pending: 1_293_774.0 },
    { sponsor: '0xd4e5f60123456789abcdefabcdef123456a1b2c3', amount: '7111988235.33', rate: '65%', pending: 749_932.8 },
    { sponsor: '0xe5f60123456789abcdefabcdef123456a1b2c3d4', amount: '1982122350.99', rate: '20%', pending: 225_443.13 },
  ];

  const getTotal = (data: typeof rows) =>
    data.reduce((acc, curr) => acc + curr.pending, 0)
        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mb-6 group bg-[#1A1D2E] hover:bg-[rgb(79,86,101)] p-4 rounded">
      <h2 className={headerStyle}>Manage Sponsor Accounts</h2>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-white border-b border-gray-600">
          <tr>
            <th className="py-2">Sponsor</th>
            <th className="py-2">Amount Sponsored</th>
            <th className="py-2">Sponsored Rate</th>
            <th className="py-2">Pending Amount</th>
            <th className="py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sponsor, amount, rate, pending }, idx) => (
            <tr key={idx} className="border-b border-gray-700">
              <td className="py-2 pr-4 truncate">{sponsor}</td>
              <td className="py-2 pr-4">{amount}</td>
              <td className="py-2 pr-4">{rate}</td>
              <td className="py-2 pr-4">{pending.toLocaleString()}</td>
              <td className="py-2 text-right">
                <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">
                  Claim
                </button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-gray-600">
            <td className="py-2 font-semibold text-white">Total Pending Rewards</td>
            <td colSpan={2}></td>
            <td className="py-2 font-semibold text-white">{getTotal(rows)}</td>
            <td className="text-right">
              <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">
                Claim All
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
