// Quick test script to verify the photo sync is working
"use client"
import React, { useState } from 'react';
import AutoSyncPhotoCapture from '@/components/AutoSyncPhotoCapture';

export default function PhotoSyncTest() {
    const [testResults, setTestResults] = useState([]);
    const [testRunning, setTestRunning] = useState(false);

    // Test data - you can modify these values
    const testInterviewId = 'test-interview-' + Date.now();
    const testCandidateEmail = 'test@example.com';
    const testCandidateName = 'Test User';

    const addTestResult = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setTestResults(prev => [...prev, { message, type, timestamp }]);
    };

    const runComprehensiveSync = async () => {
        setTestRunning(true);
        addTestResult('🔄 Starting comprehensive photo URL sync...', 'info');

        try {
            const response = await fetch('/api/sync-all-photo-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'auto-sync' })
            });

            const result = await response.json();
            
            if (result.success) {
                addTestResult(`✅ Comprehensive sync completed!`, 'success');
                addTestResult(`📊 Total updated: ${result.totalUpdated} records`, 'success');
                addTestResult(`📋 Records needing sync: ${result.recordsNeedingSync}`, 'info');
                addTestResult(`📸 Photos in storage: ${result.photosInStorage}`, 'info');
                
                if (result.updateResults && result.updateResults.length > 0) {
                    addTestResult(`📝 Updated records:`, 'info');
                    result.updateResults.slice(0, 5).forEach(update => {
                        addTestResult(`  • ${update.email} -> Photo synced`, 'success');
                    });
                    if (result.updateResults.length > 5) {
                        addTestResult(`  • ... and ${result.updateResults.length - 5} more`, 'info');
                    }
                }
            } else {
                addTestResult(`❌ Comprehensive sync failed: ${result.error}`, 'error');
            }
        } catch (error) {
            addTestResult(`❌ Sync error: ${error.message}`, 'error');
        } finally {
            setTestRunning(false);
        }
    };

    const runAutoSyncTest = async () => {
        setTestRunning(true);
        setTestResults([]);
        addTestResult('🧪 Starting auto-sync functionality test...', 'info');

        try {
            // Test 1: Check if APIs are accessible
            addTestResult('📋 Testing API endpoints...', 'info');
            
            // Test upload-photo endpoint
            const uploadTestResponse = await fetch('/api/upload-photo', {
                method: 'POST',
                body: new FormData() // Empty form data to test endpoint existence
            });
            
            if (uploadTestResponse.status === 400) {
                addTestResult('✅ upload-photo API endpoint is accessible', 'success');
            } else {
                addTestResult(`⚠️ upload-photo API returned status: ${uploadTestResponse.status}`, 'warning');
            }

            // Test sync-photo-urls endpoint
            const syncResponse = await fetch('/api/sync-photo-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'auto-sync',
                    interviewId: testInterviewId,
                    candidateEmail: testCandidateEmail
                })
            });

            const syncResult = await syncResponse.json();
            if (syncResult.success) {
                addTestResult('✅ sync-photo-urls API is working', 'success');
                addTestResult(`📊 Sync result: ${syncResult.summary?.totalPhotosFound || 0} photos found`, 'info');
            } else {
                addTestResult(`❌ sync-photo-urls API error: ${syncResult.error}`, 'error');
            }

            // Test 2: Check database connection
            addTestResult('🗄️ Testing database connection...', 'info');
            
            // Create a test database record to verify table structure
            const testRecord = {
                interview_session_id: testInterviewId,
                candidate_email: testCandidateEmail,
                candidate_name: testCandidateName,
                candidate_photo_url: null,
                photo_status: 'pending'
            };

            const dbTestResponse = await fetch('/api/test-db-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testRecord)
            });

            if (dbTestResponse.ok) {
                addTestResult('✅ Database connection test successful', 'success');
            } else {
                addTestResult('⚠️ Database connection test endpoint not found (this is normal)', 'warning');
            }

            addTestResult('🎯 Test complete! You can now test photo capture with the component below.', 'success');

        } catch (error) {
            addTestResult(`❌ Test error: ${error.message}`, 'error');
        } finally {
            setTestRunning(false);
        }
    };

    const handlePhotoSynced = (result) => {
        if (result.success) {
            addTestResult(`✅ Photo captured and synced: ${result.photoUrl}`, 'success');
        } else {
            addTestResult(`❌ Photo sync failed: ${result.error}`, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        📸 Photo Auto-Sync Test Console
                    </h1>
                    
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={runComprehensiveSync}
                            disabled={testRunning}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {testRunning ? '🔄 Syncing...' : '🎯 Sync ALL Photo URLs'}
                        </button>
                        
                        <button
                            onClick={runAutoSyncTest}
                            disabled={testRunning}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {testRunning ? '🔄 Testing...' : '🧪 Run API Tests'}
                        </button>
                        
                        <button
                            onClick={() => setTestResults([])}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            🗑️ Clear Results
                        </button>
                    </div>

                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                        <div className="text-gray-500 mb-2">Test Console Output:</div>
                        {testResults.map((result, index) => (
                            <div 
                                key={index} 
                                className={`mb-1 ${
                                    result.type === 'error' ? 'text-red-400' :
                                    result.type === 'success' ? 'text-green-400' :
                                    result.type === 'warning' ? 'text-yellow-400' :
                                    'text-blue-400'
                                }`}
                            >
                                [{result.timestamp}] {result.message}
                            </div>
                        ))}
                        {testResults.length === 0 && (
                            <div className="text-gray-500">
                                Click "Run API Tests" to start testing the auto-sync functionality...
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        📷 Test Photo Capture & Auto-Sync
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Interview ID:
                            </label>
                            <input 
                                type="text" 
                                value={testInterviewId} 
                                readOnly 
                                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Candidate Email:
                            </label>
                            <input 
                                type="text" 
                                value={testCandidateEmail} 
                                readOnly 
                                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-sm"
                            />
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <AutoSyncPhotoCapture
                            interviewId={testInterviewId}
                            candidateEmail={testCandidateEmail}
                            candidateName={testCandidateName}
                            onPhotoSynced={handlePhotoSynced}
                        />
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2">📋 How to Use:</h3>
                        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                            <li><strong>Sync ALL Photo URLs</strong>: Automatically sync all uploaded photos to database (recommended)</li>
                            <li><strong>Run API Tests</strong>: Test individual API endpoints for troubleshooting</li>
                            <li>Take a photo and click "Save & Sync" for manual testing</li>
                            <li>Check the console output for detailed sync results</li>
                            <li>Verify in your Supabase database that the candidate_photo_url column is populated</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}