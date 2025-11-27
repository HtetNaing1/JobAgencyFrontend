'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button } from '@/components/ui';
import api from '@/lib/api';

interface Inquiry {
  _id: string;
  course: {
    _id: string;
    title: string;
    category: string;
  };
  inquirer?: {
    _id: string;
    email: string;
  };
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'pending' | 'contacted' | 'enrolled' | 'closed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'enrolled' | 'closed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/me/inquiries');
      setInquiries(response.data.data);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (inquiryId: string, newStatus: string, newNotes?: string) => {
    try {
      setUpdateLoading(true);
      await api.put(`/courses/inquiries/${inquiryId}`, {
        status: newStatus,
        notes: newNotes
      });
      setInquiries(inquiries.map(inq =>
        inq._id === inquiryId
          ? { ...inq, status: newStatus as Inquiry['status'], notes: newNotes || inq.notes }
          : inq
      ));
      setSelectedInquiry(null);
      setNotes('');
    } catch (error) {
      console.error('Failed to update inquiry:', error);
      alert('Failed to update inquiry status. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredInquiries = filter === 'all'
    ? inquiries
    : inquiries.filter(inq => inq.status === filter);

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    contacted: inquiries.filter(i => i.status === 'contacted').length,
    enrolled: inquiries.filter(i => i.status === 'enrolled').length,
    closed: inquiries.filter(i => i.status === 'closed').length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'contacted':
        return 'bg-blue-100 text-blue-700';
      case 'enrolled':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute allowedRoles={['training_center']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Course Inquiries</h1>
            <p className="text-gray-600 mt-1">Manage inquiries from potential students</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.contacted}</p>
              <p className="text-sm text-gray-500">Contacted</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.enrolled}</p>
              <p className="text-sm text-gray-500">Enrolled</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              <p className="text-sm text-gray-500">Closed</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(['all', 'pending', 'contacted', 'enrolled', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {status === 'all' ? stats.total : stats[status]}
                </span>
              </button>
            ))}
          </div>

          {/* Inquiries List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No inquiries yet' : `No ${filter} inquiries`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all'
                  ? 'Inquiries from potential students will appear here'
                  : `You don't have any ${filter} inquiries`}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInquiries.map((inquiry) => (
                <Card key={inquiry._id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Inquiry Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </div>

                      {/* Course */}
                      {inquiry.course ? (
                        <Link href={`/training/${inquiry.course._id}`} className="inline-block mb-3">
                          <span className="text-purple-600 hover:text-purple-700 font-medium">
                            {inquiry.course.title}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            ({inquiry.course.category})
                          </span>
                        </Link>
                      ) : (
                        <div className="mb-3">
                          <span className="text-gray-400 font-medium">Course Deleted</span>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-medium text-gray-900">{inquiry.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <a href={`mailto:${inquiry.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                            {inquiry.email}
                          </a>
                        </div>
                        {inquiry.phone && (
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <a href={`tel:${inquiry.phone}`} className="font-medium text-gray-900 hover:text-blue-600">
                              {inquiry.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Message */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Message</p>
                        <p className="text-gray-700 text-sm">{inquiry.message}</p>
                      </div>

                      {/* Notes */}
                      {inquiry.notes && (
                        <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                          <p className="text-xs text-yellow-700 mb-1">Your Notes</p>
                          <p className="text-yellow-800 text-sm">{inquiry.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      {inquiry.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(inquiry._id, 'contacted')}
                          className="flex-1 lg:flex-none"
                        >
                          Mark Contacted
                        </Button>
                      )}
                      {(inquiry.status === 'pending' || inquiry.status === 'contacted') && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(inquiry._id, 'enrolled')}
                          className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700"
                        >
                          Mark Enrolled
                        </Button>
                      )}
                      {inquiry.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setNotes(inquiry.notes || '');
                          }}
                          className="flex-1 lg:flex-none"
                        >
                          {inquiry.notes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                      )}
                      {inquiry.status !== 'closed' && inquiry.status !== 'enrolled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(inquiry._id, 'closed')}
                          className="flex-1 lg:flex-none text-gray-600"
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedInquiry.notes ? 'Edit Notes' : 'Add Notes'}
              </h3>
              <button
                onClick={() => {
                  setSelectedInquiry(null);
                  setNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Inquiry from <span className="font-medium">{selectedInquiry.name}</span> for{' '}
              <span className="font-medium">{selectedInquiry.course?.title || 'Deleted Course'}</span>
            </p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              placeholder="Add notes about this inquiry (e.g., follow-up actions, conversation details)..."
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedInquiry(null);
                  setNotes('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedInquiry._id, selectedInquiry.status, notes)}
                isLoading={updateLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Save Notes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </ProtectedRoute>
  );
}
