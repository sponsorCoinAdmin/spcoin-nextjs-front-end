'use client';

import React, { useState, useEffect } from 'react';

export default function ManageAccountsPage() {
  const [selectedRole, setSelectedRole] = useState<'recipient' | 'agent' | 'sponsor' | 'totalSummary' | null>(null);
  const [accountKey, setAccountKey] = useState('');

  const headerStyle =
    'text-xl font-semibold mb-2 text-[#5981F3] group-hover:text-[#000000] transition-colors';

  useEffect(() => {
    if (selectedRole === 'recipient') {
      alert('This is a Recipient Mock Demo and is yet to be implemented and is currently a Work In Progress.');
    } else if (selectedRole === 'agent') {
      alert('This is an Agent Mock Demo and is yet to be implemented and is currently a Work In Progress.');
    } else if (selectedRole === 'sponsor') {
      alert('This is a Sponsor Mock Demo and is yet to be implemented and is currently a Work In Progress.');
    }
  }, [selectedRole]);

  const recipientData = [
    { sponsorKey: '0x886dfe3d323eb44e41e18aeb3c7c893e93b88806', amount: '3360922354218506.50', rate: '50%', pending: 421528551.103 },
    { sponsorKey: '0xe2eb73f5511dc62abce8945934096a155569c18f', amount: '9499369765121016.00', rate: '50%', pending: 178427584.561 },
    { sponsorKey: '0x37ca86028c36ef54dc79e387d330c080ace8fe1c', amount: '4752509924599621.00', rate: '80%', pending: 156961960.051 },
    { sponsorKey: '0x5391298deaad73e797bf4d5911558ef7864e344b', amount: '1774686884482976.50', rate: '50%', pending: 167246408.492 },
    { sponsorKey: '0x162be067bcd792e8a9574e1dbe93e14a7a098366', amount: '7503273758524645.00', rate: '60%', pending: 826557268.796 }
  ];

  const agentData = [
    {
      sponsor: '0xa11cd3f27afcb23781234baca23423451234abcd',
      recipient: '0xbb22e91a2334bd23cd2331cf234cdf234adf2233',
      rate: '70%',
      pending: 102384.32
    },
    {
      sponsor: '0xb227dfe78459acdee42345cd923ff122ed453bcd',
      recipient: '0xcc88aabe442344abcdaa2348dbfee11234bd1234',
      rate: '50%',
      pending: 88324.18
    },
    {
      sponsor: '0xc34bbcd239adfcc4321d543bbde123423123efabc',
      recipient: '0xdd99ff2345aabbcd234234cd234abcd234234fff',
      rate: '80%',
      pending: 120958.44
    },
    {
      sponsor: '0xd45623abcdf234aabff1233abcdf234abcd234fff',
      recipient: '0xeeaabbccddeeff112233445566778899aabbccdd',
      rate: '65%',
      pending: 75682.0
    },
    {
      sponsor: '0xe51123abcd234bbffccdde123ff34234bbcd3344',
      recipient: '0xff00112233445566778899aabbccddeeff112233',
      rate: '60%',
      pending: 90345.76
    }
  ];

  const sponsorData = [
    {
      sponsor: '0xa1b2c3d4e5f60123456789abcdefabcdef123456',
      amount: '5203115221.00',
      rate: '80%',
      pending: 841452.00
    },
    {
      sponsor: '0xb2c3d4e5f60123456789abcdefabcdef123456a1',
      amount: '3423412982.50',
      rate: '40%',
      pending: 328239.77
    },
    {
      sponsor: '0xc3d4e5f60123456789abcdefabcdef123456a1b2',
      amount: '9981224875.10',
      rate: '100%',
      pending: 1293774.00
    },
    {
      sponsor: '0xd4e5f60123456789abcdefabcdef123456a1b2c3',
      amount: '7111988235.33',
      rate: '65%',
      pending: 749932.80
    },
    {
      sponsor: '0xe5f60123456789abcdefabcdef123456a1b2c3d4',
      amount: '1982122350.99',
      rate: '20%',
      pending: 225443.13
    }
  ];

  const getTotal = (data: { pending: number }[]) =>
    data.reduce((acc, curr) => acc + curr.pending, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <main className="min-h-screen p-8 bg-black text-white">
      <h1 className="text-center text-2xl font-bold mb-8 text-[#E5B94F]">Manage Accounts</h1>

      <div className="flex justify-center gap-6 mb-6">
        {[
          { label: 'Recipient', value: 'recipient' },
          { label: 'Agent', value: 'agent' },
          { label: 'Sponsor', value: 'sponsor' },
          { label: 'Total Summary', value: 'totalSummary' },
        ].map(({ label, value }) => (
          <label key={value} className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value={value}
              checked={selectedRole === value}
              onChange={() => setSelectedRole(value as any)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="mb-8 bg-[#1A1D2E] hover:bg-[rgb(79,86,101)] p-4 rounded">
        <h2 className={headerStyle}>Connected Account</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="w-48 font-medium whitespace-nowrap">Public Key</label>
            <div className="flex-1">
              <input
                type="text"
                placeholder="0x..."
                value={accountKey}
                readOnly
                className="w-[46ch] max-w-full p-2 bg-[#1A1D2E] rounded border border-gray-600 text-white"
              />
            </div>
          </div>
          {['Trade Balance', 'Sponsored Balance', 'Total Balance'].map(label => (
            <div key={label} className="flex items-center gap-4">
              <label className="w-48 font-medium whitespace-nowrap">{label}</label>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter amount"
                  className="w-[46ch] max-w-full p-2 bg-[#1A1D2E] rounded border border-gray-600 text-white"
                  readOnly
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {(selectedRole === 'recipient' || selectedRole === 'totalSummary') && (
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
              {recipientData.map(({ sponsorKey, amount, rate, pending }, idx) => (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="pr-4 truncate">{sponsorKey}</td>
                  <td className="pr-4">{amount}</td>
                  <td className="pr-4">{rate}</td>
                  <td className="pr-4">{pending.toLocaleString()}</td>
                  <td className="text-right">
                    <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">Claim</button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-600">
                <td className="py-2 font-semibold text-white">Total Pending Rewards</td>
                <td colSpan={2}></td>
                <td className="py-2 font-semibold text-white">{getTotal(recipientData)}</td>
                <td className="text-right">
                  <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">Claim All</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {(selectedRole === 'sponsor' || selectedRole === 'totalSummary') && (
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
              {sponsorData.map(({ sponsor, amount, rate, pending }, idx) => (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="py-2 pr-4 truncate">{sponsor}</td>
                  <td className="py-2 pr-4">{amount}</td>
                  <td className="py-2 pr-4">{rate}</td>
                  <td className="py-2 pr-4">{pending.toLocaleString()}</td>
                  <td className="py-2 text-right">
                    <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">Claim</button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-600">
                <td className="py-2 font-semibold text-white">Total Pending Rewards</td>
                <td colSpan={2}></td>
                <td className="py-2 font-semibold text-white">{getTotal(sponsorData)}</td>
                <td className="text-right">
                  <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">Claim All</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {(selectedRole === 'agent' || selectedRole === 'totalSummary') && (
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
              {agentData.map(({ sponsor, recipient, rate, pending }, idx) => (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="pr-4 truncate">{sponsor}</td>
                  <td className="pr-4 truncate">{recipient}</td>
                  <td className="pr-4">{rate}</td>
                  <td className="pr-4">{pending.toLocaleString()}</td>
                  <td className="text-right">
                    <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">Claim</button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-600">
                <td className="py-2 font-semibold text-white">Total Pending Rewards</td>
                <td colSpan={2}></td>
                <td className="py-2 font-semibold text-white">{getTotal(agentData)}</td>
                <td className="text-right">
                  <button className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-4 py-1 rounded">Claim All</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {selectedRole === 'totalSummary' && (
        <div id="ManageSummary_Id" className="mb-6 group bg-[#1A1D2E] hover:bg-[rgb(79,86,101)] p-4 rounded">
          <h2 className={headerStyle}>Total Accounts Summary</h2>
        </div>
      )}
    </main>
  );
}
