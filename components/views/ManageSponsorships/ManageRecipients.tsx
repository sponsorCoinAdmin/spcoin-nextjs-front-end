'use client';

import React from 'react';

export default function ManageRecipients() {
  const headerStyle =
    'text-xl font-semibold mb-2 text-[#5981F3] group-hover:text-[#000000] transition-colors';

  const rows = [
    { sponsorKey: '0x886dfe3d323eb44e41e18aeb3c7c893e93b88806', amount: '3360922354218506.50', rate: '50%', pending: 421_528_551.103 },
    { sponsorKey: '0xe2eb73f5511dc62abce8945934096a155569c18f', amount: '9499369765121016.00', rate: '50%', pending: 178_427_584.561 },
    { sponsorKey: '0x37ca86028c36ef54dc79e387d330c080ace8fe1c', amount: '4752509924599621.00', rate: '80%', pending: 156_961_960.051 },
    { sponsorKey: '0x5391298deaad73e797bf4d5911558ef7864e344b', amount: '1774686884482976.50', rate: '50%', pending: 167_246_408.492 },
    { sponsorKey: '0x162be067bcd792e8a9574e1dbe93e14a7a098366', amount: '7503273758524645.00', rate: '60%', pending: 826_557_268.796 },
  ];

  const getTotal = (data: typeof rows) =>
    data.reduce((acc, curr) => acc + curr.pending, 0)
        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mb-6 group bg-[#1A1D2E] hover:bg-[rgb(79,86,101)] p-4 rounded">
      <h2 className={headerStyle}>Manage Recipient Accounts</h2>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-white border-b border-gray-600">
          <tr>
            <th>Sponsor Public Key</th>
            <th>Amount Sponsored</th>
            <th>Recipient Rate</th>
            <th>Pending Amount</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sponsorKey, amount, rate, pending }, idx) => (
            <tr key={idx} className="border-b border-gray-700">
              <td className="pr-4 truncate">{sponsorKey}</td>
              <td className="pr-4">{amount}</td>
              <td className="pr-4">{rate}</td>
              <td className="pr-4">{pending.toLocaleString()}</td>
              <td className="text-right">
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
