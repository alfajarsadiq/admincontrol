// File: src/pages/OrderReportPage.tsx (FINAL FUNCTIONAL CODE WITH DUPLICATE FIX)

import React, { useState, useEffect } from 'react';
import moment from 'moment'; 

// Assuming your API call setup is available via 'api' and new functions are exported
import { sendManualReport, fetchReportHistory } from '../lib/api'; 
// Import the newly defined type
import { ReportRecord } from '../types'; 
import { Search } from 'lucide-react';

interface DateState {
  startDate: string;
  endDate: string;
}

const OrderReportPage: React.FC = () => {
  // Set default range to the previous full month
  const defaultStartDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
  const defaultEndDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

  const [dateRange, setDateRange] = useState<DateState>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });
  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  // Function to fetch report history
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const records = await fetchReportHistory();
      setHistory(records);
    } catch (error) {
      console.error('Failed to fetch report history:', error);
      setMessage('Error loading report history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Handler for the "Force Send" button
  const handleForceSend = async () => {
    // 🔥 CRITICAL FIX: Add a guard to prevent double submissions from race conditions or double clicks
    if (isSending) return;
    
    if (!dateRange.startDate || !dateRange.endDate) {
      setMessage('Please select both start and end dates.');
      return;
    }
    
    setIsSending(true);
    setMessage('Generating and sending report in the background...');

    try {
      // API call to POST /api/reports/send-manual
      await sendManualReport(dateRange.startDate, dateRange.endDate);
      
      // Give the backend a moment to log the 'Processing' record
      setTimeout(loadHistory, 1500); 

      setMessage('Report generation started successfully. Check your email (and history log) soon.');
    } catch (error: any) {
      // This logic handles the detailed error message thrown by api.ts (e.g., the 403 message)
      const errorMsg = error.message || 'Failed to trigger report. Check server logs.';
      setMessage(`Error: ${errorMsg}`);
      console.error('Manual report send failed:', error);
    } finally {
      setIsSending(false); // Unlock the button
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="admin-page-container p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
        <Search className="w-7 h-7 mr-2 text-blue-600" />
        Monthly Order Reports
      </h1>
      
      {/* Report Generation Section */}
      <div className="bg-white p-6 shadow-xl rounded-lg mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Force Generate & Send Report</h2>
        <p className="text-sm text-gray-500 mb-4">Select the date range for the data you want to include in the report (e.g., 2024-01-01 to 2024-01-31).</p>
        
        <div className="flex space-x-4 items-end">
          <div className="flex flex-col">
            <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleForceSend}
            disabled={isSending}
            className={`px-6 py-2.5 text-white font-medium rounded-md shadow-lg transition duration-150 ${
              isSending ? 'bg-yellow-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSending ? 'Sending...' : 'Force Send Report'}
          </button>
        </div>
        
        {message && (
          <p className={`mt-4 text-sm font-medium ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Report History Section */}
      <div className="bg-white p-6 shadow-xl rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex justify-between items-center">
          Recent Report Records
          <button onClick={loadHistory} className="text-blue-500 hover:text-blue-700 text-sm">Refresh</button>
        </h2>
        
        {loadingHistory ? (
          <p className="text-center py-4">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No reports found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GCS Link</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((record) => (
                  <tr key={record._id} className={record.type === 'Automated' ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.type} {record.requestedBy?.name ? `(${record.requestedBy.name})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(record.dateRange.startDate).format('MMM D, YYYY')} - {moment(record.dateRange.endDate).format('MMM D, YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(record.generatedAt).format('MMM D, h:mm A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'Success' ? 'bg-green-100 text-green-800' :
                        record.status === 'Failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {record.gcsLink && record.status === 'Success' ? (
                        <a href={record.gcsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">Download</a>
                      ) : (
                        <span className="text-gray-400">{record.status === 'Failed' ? 'Error' : 'Pending'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderReportPage;