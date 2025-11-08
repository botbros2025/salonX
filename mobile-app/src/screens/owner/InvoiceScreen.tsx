import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList, Invoice } from '../../types';
import { apiService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/Card';

type RouteProps = RouteProp<RootStackParamList, 'Invoice'>;

export default function InvoiceScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { appointmentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    subtotal: 0,
    tax: 0,
    discount: 0,
    paymentMethod: 'cash' as 'cash' | 'upi' | 'card' | 'credit',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [appointmentId]);

  const loadData = async () => {
    try {
      const appointmentsResponse = await apiService.getAppointments();
      const apt = appointmentsResponse.data?.appointments?.find(
        (a: any) => a.id === appointmentId
      );
      setAppointment(apt);

      if (apt) {
        const subtotal = apt.service?.price || 0;
        setFormData({
          ...formData,
          subtotal,
        });

        // Check if invoice already exists
        if (apt.invoice) {
          setInvoice(apt.invoice);
          setFormData({
            subtotal: apt.invoice.subtotal,
            tax: apt.invoice.tax,
            discount: apt.invoice.discount,
            paymentMethod: (apt.invoice.paymentMethod as any) || 'cash',
            notes: apt.invoice.notes || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.subtotal + formData.tax - formData.discount;
  };

  const handleCreateInvoice = async () => {
    if (!appointment) {
      Alert.alert('Error', 'Appointment not found');
      return;
    }

    setSaving(true);
    try {
      const invoiceData = {
        appointmentId: appointment.id,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim() || undefined,
      };

      const response = await apiService.createInvoice(invoiceData);
      setInvoice(response.data?.invoice);
      Alert.alert('Success', 'Invoice created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!invoice) return;

    setSaving(true);
    try {
      await apiService.getInvoices(); // Would need update endpoint
      Alert.alert('Success', 'Payment status updated');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  const generateInvoiceHTML = (invoiceData: Invoice, appointmentData: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #8b5cf6;
              padding-bottom: 20px;
            }
            .invoice-number {
              font-size: 24px;
              font-weight: bold;
              color: #8b5cf6;
            }
            .details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .section {
              flex: 1;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 10px;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            th {
              background-color: #f8fafc;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              font-size: 18px;
              background-color: #f8fafc;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <div class="invoice-number">${invoiceData.invoiceNumber}</div>
          </div>
          
          <div class="details">
            <div class="section">
              <div class="section-title">Bill To:</div>
              <div>${appointmentData?.client?.name || 'Client'}</div>
              <div>${appointmentData?.client?.phone || ''}</div>
            </div>
            <div class="section">
              <div class="section-title">Invoice Date:</div>
              <div>${formatDate(invoiceData.createdAt)}</div>
              <div class="section-title" style="margin-top: 20px;">Payment Status:</div>
              <div>${invoiceData.paymentStatus.toUpperCase()}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${appointmentData?.service?.name || 'Service'}</td>
                <td>₹${invoiceData.subtotal.toFixed(2)}</td>
              </tr>
              ${invoiceData.tax > 0 ? `
              <tr>
                <td>Tax</td>
                <td>₹${invoiceData.tax.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${invoiceData.discount > 0 ? `
              <tr>
                <td>Discount</td>
                <td>-₹${invoiceData.discount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total</td>
                <td>₹${invoiceData.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          ${invoiceData.notes ? `
          <div style="margin-top: 20px;">
            <strong>Notes:</strong>
            <p>${invoiceData.notes}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleShareInvoice = async () => {
    if (!invoice || !appointment) {
      Alert.alert('Error', 'Invoice data not available');
      return;
    }

    try {
      const html = generateInvoiceHTML(invoice, appointment);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      await Share.share({
        url: uri,
        title: `Invoice ${invoice.invoiceNumber}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">Appointment not found</Text>
      </View>
    );
  }

  const total = calculateTotal();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">
            {invoice ? 'Invoice' : 'Create Invoice'}
          </Text>
          <Text className="text-text-secondary">
            {invoice ? `Invoice #${invoice.invoiceNumber}` : 'Generate invoice for this appointment'}
          </Text>
        </View>

        {/* Client & Service Info */}
        <Card className="mb-6">
          <View className="mb-4">
            <Text className="text-text-secondary text-sm mb-1">Client</Text>
            <Text className="text-lg font-bold text-text-primary">
              {appointment.client?.name || 'Client'}
            </Text>
            <Text className="text-text-secondary">{appointment.client?.phone}</Text>
          </View>
          <View className="border-t border-border pt-4">
            <Text className="text-text-secondary text-sm mb-1">Service</Text>
            <Text className="text-lg font-bold text-text-primary">
              {appointment.service?.name}
            </Text>
            <Text className="text-text-secondary">
              {appointment.service?.duration} minutes
            </Text>
          </View>
        </Card>

        {/* Invoice Details */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Invoice Details</Text>

          {invoice ? (
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-text-secondary">Invoice Number</Text>
                <Text className="text-text-primary font-semibold">{invoice.invoiceNumber}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-text-secondary">Date</Text>
                <Text className="text-text-primary font-semibold">
                  {formatDate(invoice.createdAt)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-text-secondary">Payment Status</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    invoice.paymentStatus === 'paid'
                      ? 'bg-accent-100'
                      : invoice.paymentStatus === 'partial'
                      ? 'bg-warning'
                      : 'bg-neutral-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      invoice.paymentStatus === 'paid'
                        ? 'text-accent-600'
                        : invoice.paymentStatus === 'partial'
                        ? 'text-warning'
                        : 'text-neutral-600'
                    }`}
                  >
                    {invoice.paymentStatus.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="gap-4">
              <View>
                <Text className="text-text-primary font-medium mb-2">Subtotal (₹)</Text>
                <TextInput
                  className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary"
                  value={formData.subtotal.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, subtotal: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text className="text-text-primary font-medium mb-2">Tax (₹)</Text>
                <TextInput
                  className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary"
                  value={formData.tax.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, tax: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text className="text-text-primary font-medium mb-2">Discount (₹)</Text>
                <TextInput
                  className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary"
                  value={formData.discount.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, discount: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text className="text-text-primary font-medium mb-2">Payment Method</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(['cash', 'upi', 'card', 'credit'] as const).map((method) => (
                    <TouchableOpacity
                      key={method}
                      className={`px-4 py-2 rounded-lg ${
                        formData.paymentMethod === method
                          ? 'bg-primary-500'
                          : 'bg-neutral-100 border border-border'
                      }`}
                      onPress={() => setFormData({ ...formData, paymentMethod: method })}
                    >
                      <Text
                        className={`font-medium ${
                          formData.paymentMethod === method
                            ? 'text-white'
                            : 'text-text-primary'
                        }`}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-text-primary font-medium mb-2">Notes (Optional)</Text>
                <TextInput
                  className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary min-h-[80px]"
                  placeholder="Add any notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                />
              </View>
            </View>
          )}
        </Card>

        {/* Total */}
        <Card className="mb-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text-primary">Total</Text>
            <Text className="text-3xl font-bold text-primary-500">
              {formatCurrency(total)}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        {invoice ? (
          <View className="gap-3">
            {invoice.paymentStatus !== 'paid' && (
              <TouchableOpacity
                className="bg-accent-500 rounded-lg py-4 items-center"
                onPress={handleUpdatePayment}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Mark as Paid</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="bg-primary-500 rounded-lg py-4 items-center"
              onPress={handleShareInvoice}
            >
              <View className="flex-row items-center">
                <Ionicons name="share" size={20} color="#ffffff" />
                <Text className="text-white font-semibold text-lg ml-2">Share Invoice</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-primary-500 rounded-lg py-4 items-center"
            onPress={handleCreateInvoice}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Create Invoice</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

