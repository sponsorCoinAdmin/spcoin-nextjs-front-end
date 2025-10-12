'use client';

import React from 'react';

export default function ManageAgents() {
  const headerStyle =
    'text-xl font-semibold mb-2 text-[#5981F3] group-hover:text-[#000000] transition-colors';

  const rows = [
    { sponsor: '0xa11cd3f27afcb23781234baca23423451234abcd', recipient: '0xbb22e91a2334bd23cd2331cf234cdf234adf2233', rate: '70%', pending: 102_384.32 },
    { sponsor: '0xb227dfe78459acdee42345cd923ff122ed453bcd', recipient: '0xcc88aabe442344abcdaa2348dbfee11234bd1234', rate: '50%', pending: 88_324.18 },
    { sponsor: '0xc34bbcd239adfcc4321d543bbde123423123efabc', recipient: '0xdd99ff2345aabbcd234234cd234abcd234234fff', rate: '80%', pending: 120_958.44 },
    { sponsor: '0xd45623abcdf234aabff1233abcdf234abcd234fff', recipient: '0xeeaabbccddeeff112233445566778899aabbccdd', rate: '65%', pending: 75_682.0 },
    { sponsor: '0xe51123abcd234bbffccdde123ff34234bbcd3344', recipient: '0xff00112233445566778899aabbccddeeff112233', rate: '60%', pending: 90_345.76 },
  ];

  const getTotal = (data: typeof rows) =>
    data.reduce((acc, curr) => acc + curr.pending, 0)
        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mb-6 group bg-[#1A1D2E] hover:bg-[rgb(79,86,101)] p-4 rounded">
      <h2 className={headerStyle}>Manage Agent Accounts</h2>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-white border-b border-gray-600">
          <tr>
            <th>Sponsor</th>
            <th>Recipient</th>
            <th>Agent Rate</th>
            <th>Pending Amount (10% Agent)</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sponsor, recipient, rate, pending }, idx) => (
            <tr key={idx} className="border-b border-gray-700">
              <td className="pr-4 truncate">{sponsor}</td>
              <td className="pr-4 truncate">{recipient}</td>
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
