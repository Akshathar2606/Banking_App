import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  getBeneficiaries,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  Beneficiary,
  CreateBeneficiaryData,
  UpdateBeneficiaryData,
} from '../services/beneficiaryService';
import { Colors } from '../constants/Colors';

// ── Small helpers ─────────────────────────────────────────────────────────────

const EMPTY_ADD: CreateBeneficiaryData = {
  name: '', accountNumber: '', bankName: '', ifscCode: '', nickname: '',
};

const EMPTY_EDIT: UpdateBeneficiaryData = {
  name: '', bankName: '', ifscCode: '', nickname: '', isActive: true,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BeneficiariesScreen() {
  const { token } = useAuth();
  const router    = useRouter();

  // ── List state ────────────────────────────────────────────────────────────────
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading]             = useState(false);
  const [listError, setListError]         = useState<string | null>(null);

  // ── Add-form state ────────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm]         = useState<CreateBeneficiaryData>(EMPTY_ADD);
  const [addLoading, setAddLoading]   = useState(false);
  const [addError, setAddError]       = useState<string | null>(null);
  const [addSuccess, setAddSuccess]   = useState<string | null>(null);

  // ── Edit state (one beneficiary at a time) ────────────────────────────────────
  const [editId, setEditId]           = useState<string | null>(null);
  const [editForm, setEditForm]       = useState<UpdateBeneficiaryData>(EMPTY_EDIT);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState<string | null>(null);

  // ── Delete state ──────────────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading]     = useState<string | null>(null);
  const [deleteError, setDeleteError]         = useState<string | null>(null);

  // ── Global action feedback ────────────────────────────────────────────────────
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Load beneficiaries ────────────────────────────────────────────────────────
  const loadBeneficiaries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setListError(null);
    try {
      const data = await getBeneficiaries(token);
      setBeneficiaries(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load beneficiaries.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadBeneficiaries(); }, [loadBeneficiaries]);

  // ── Add handler ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setAddError(null);
    setSuccessMessage(null);

    if (!addForm.name.trim())          { setAddError('Name is required.');           return; }
    if (!addForm.accountNumber.trim()) { setAddError('Account number is required.'); return; }
    if (!addForm.bankName.trim())      { setAddError('Bank name is required.');       return; }
    if (!addForm.ifscCode.trim())      { setAddError('IFSC code is required.');       return; }

    setAddLoading(true);
    try {
      const created = await createBeneficiary(token!, {
        name:          addForm.name.trim(),
        accountNumber: addForm.accountNumber.trim(),
        bankName:      addForm.bankName.trim(),
        ifscCode:      addForm.ifscCode.trim(),
        ...(addForm.nickname?.trim() ? { nickname: addForm.nickname.trim() } : {}),
      });
      setSuccessMessage(`"${created.name}" added to your beneficiaries.`);
      setAddForm(EMPTY_ADD);
      setShowAddForm(false);
      await loadBeneficiaries();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add beneficiary.');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Open edit ─────────────────────────────────────────────────────────────────
  const openEdit = (b: Beneficiary) => {
    setEditId(b._id);
    setEditForm({
      name:     b.name,
      bankName: b.bankName,
      ifscCode: b.ifscCode,
      nickname: b.nickname ?? '',
      isActive: b.isActive,
    });
    setEditError(null);
    setDeleteConfirmId(null);
    setSuccessMessage(null);
  };

  // ── Save edit ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editId || !token) return;
    setEditError(null);

    if (!editForm.name?.trim())     { setEditError('Name is required.');     return; }
    if (!editForm.bankName?.trim()) { setEditError('Bank name is required.'); return; }
    if (!editForm.ifscCode?.trim()) { setEditError('IFSC code is required.'); return; }

    setEditLoading(true);
    try {
      const updated = await updateBeneficiary(token, editId, {
        name:     editForm.name?.trim(),
        bankName: editForm.bankName?.trim(),
        ifscCode: editForm.ifscCode?.trim(),
        nickname: editForm.nickname?.trim() || undefined,
        isActive: editForm.isActive,
      });
      setSuccessMessage(`"${updated.name}" updated successfully.`);
      setEditId(null);
      await loadBeneficiaries();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update beneficiary.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeletePress = (b: Beneficiary) => {
    setSuccessMessage(null);
    setDeleteError(null);

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Delete Beneficiary',
        `Remove "${b.name}" from your beneficiaries?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => executeDelete(b) },
        ]
      );
    } else {
      setDeleteConfirmId(b._id);
      setEditId(null);
    }
  };

  const executeDelete = async (b: Beneficiary) => {
    if (!token) return;
    setDeleteConfirmId(null);
    setDeleteLoading(b._id);
    setDeleteError(null);
    try {
      await deleteBeneficiary(token, b._id);
      setSuccessMessage(`"${b.name}" has been removed.`);
      await loadBeneficiaries();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete beneficiary.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beneficiaries</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => { setShowAddForm(v => !v); setAddError(null); setAddSuccess(null); }}
          activeOpacity={0.7}
        >
          <Text style={styles.addIcon}>{showAddForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Global success */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Global delete error */}
        {deleteError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{deleteError}</Text>
          </View>
        )}

        {/* ── Add form ── */}
        {showAddForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Beneficiary</Text>

            {addError && (
              <View style={styles.inlineError}>
                <Text style={styles.inlineErrorText}>{addError}</Text>
              </View>
            )}
            {addSuccess && (
              <View style={styles.inlineSuccess}>
                <Text style={styles.inlineSuccessText}>{addSuccess}</Text>
              </View>
            )}

            {(['name','accountNumber','bankName','ifscCode'] as (keyof CreateBeneficiaryData)[]).map((field) => (
              <View key={field} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {field === 'accountNumber' ? 'Account Number'
                    : field === 'bankName'   ? 'Bank Name'
                    : field === 'ifscCode'   ? 'IFSC Code'
                    : 'Name'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={addForm[field] as string}
                  onChangeText={v => setAddForm(f => ({ ...f, [field]: v }))}
                  placeholder={field === 'ifscCode' ? 'e.g. HDFC0001234' : ''}
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize={field === 'ifscCode' ? 'characters' : 'words'}
                  autoCorrect={false}
                  editable={!addLoading}
                />
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Nickname <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={addForm.nickname}
                onChangeText={v => setAddForm(f => ({ ...f, nickname: v }))}
                placeholder='e.g. Mom, Landlord'
                placeholderTextColor={Colors.textLight}
                editable={!addLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, addLoading && styles.buttonDisabled]}
              onPress={handleAdd}
              disabled={addLoading}
              activeOpacity={0.8}
            >
              {addLoading
                ? <ActivityIndicator color={Colors.backgroundLight} size="small" />
                : <Text style={styles.submitButtonText}>Add Beneficiary</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── List loading ── */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.centerText}>Loading beneficiaries…</Text>
          </View>
        )}

        {/* ── List error ── */}
        {!loading && listError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{listError}</Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!loading && !listError && beneficiaries.length === 0 && (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No beneficiaries yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to add a saved recipient for quick transfers.
            </Text>
          </View>
        )}

        {/* ── Beneficiary list ── */}
        {!loading && beneficiaries.map((b) => {
          const isEditing    = editId  === b._id;
          const isDelConfirm = deleteConfirmId === b._id;
          const isDeleting   = deleteLoading   === b._id;

          return (
            <View key={b._id} style={styles.card}>
              {/* Read view */}
              {!isEditing && (
                <>
                  <View style={styles.beneHeader}>
                    <View style={styles.beneAvatar}>
                      <Text style={styles.beneAvatarText}>
                        {b.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.beneInfo}>
                      <Text style={styles.beneName}>{b.name}</Text>
                      {b.nickname && (
                        <Text style={styles.beneNickname}>"{b.nickname}"</Text>
                      )}
                    </View>
                    <View style={[
                      styles.activeChip,
                      !b.isActive && styles.inactiveChip,
                    ]}>
                      <Text style={[styles.activeChipText, !b.isActive && styles.inactiveChipText]}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.beneDetails}>
                    <BeneDetailRow label="Account Number" value={b.accountNumber} />
                    <BeneDetailRow label="Bank"           value={b.bankName} />
                    <BeneDetailRow label="IFSC"           value={b.ifscCode} />
                  </View>

                  {/* Inline delete confirmation (web) */}
                  {isDelConfirm && (
                    <View style={styles.confirmBox}>
                      <Text style={styles.confirmText}>
                        Remove "{b.name}" from your beneficiaries?
                      </Text>
                      <View style={styles.confirmButtons}>
                        <TouchableOpacity
                          style={styles.confirmCancel}
                          onPress={() => setDeleteConfirmId(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.confirmCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmDelete}
                          onPress={() => executeDelete(b)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.confirmDeleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Action row */}
                  {!isDelConfirm && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openEdit(b)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.editButtonText}>✏ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
                        onPress={() => handleDeletePress(b)}
                        disabled={isDeleting}
                        activeOpacity={0.8}
                      >
                        {isDeleting
                          ? <ActivityIndicator color={Colors.backgroundLight} size="small" />
                          : <Text style={styles.deleteButtonText}>🗑 Delete</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {/* Edit form */}
              {isEditing && (
                <>
                  <Text style={styles.cardTitle}>Edit Beneficiary</Text>
                  <Text style={styles.editLockedNote}>
                    🔒  Account number cannot be changed: {b.accountNumber}
                  </Text>

                  {editError && (
                    <View style={styles.inlineError}>
                      <Text style={styles.inlineErrorText}>{editError}</Text>
                    </View>
                  )}

                  {(['name','bankName','ifscCode','nickname'] as (keyof UpdateBeneficiaryData)[]).map((field) => (
                    <View key={field} style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        {field === 'bankName' ? 'Bank Name'
                          : field === 'ifscCode' ? 'IFSC Code'
                          : field === 'nickname' ? <>Nickname <Text style={styles.optional}>(optional)</Text></>
                          : 'Name'}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={(editForm[field] as string) ?? ''}
                        onChangeText={v => setEditForm(f => ({ ...f, [field]: v }))}
                        autoCapitalize={field === 'ifscCode' ? 'characters' : 'words'}
                        autoCorrect={false}
                        editable={!editLoading}
                      />
                    </View>
                  ))}

                  {/* isActive toggle */}
                  <View style={styles.toggleRow}>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <TouchableOpacity
                      style={[styles.toggleButton, editForm.isActive && styles.toggleButtonActive]}
                      onPress={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.toggleText, editForm.isActive && styles.toggleTextActive]}>
                        {editForm.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editActionRow}>
                    <TouchableOpacity
                      style={styles.cancelEditButton}
                      onPress={() => setEditId(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelEditText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveButton, editLoading && styles.buttonDisabled]}
                      onPress={handleSaveEdit}
                      disabled={editLoading}
                      activeOpacity={0.8}
                    >
                      {editLoading
                        ? <ActivityIndicator color={Colors.backgroundLight} size="small" />
                        : <Text style={styles.saveButtonText}>Save Changes</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Small sub-component ───────────────────────────────────────────────────────

function BeneDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  iconButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: Colors.text, fontWeight: '600' },
  addIcon:  { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Banners
  successBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.success + '18',
    borderLeftWidth: 3, borderLeftColor: Colors.success,
    borderRadius: 10, padding: 14, marginBottom: 14, gap: 10,
  },
  successIcon: { fontSize: 16, color: Colors.success, fontWeight: '700', marginTop: 1 },
  successText: { flex: 1, fontSize: 13, color: Colors.success, fontWeight: '500', lineHeight: 20 },
  errorBanner: {
    backgroundColor: Colors.error + '18',
    borderLeftWidth: 3, borderLeftColor: Colors.error,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14,
  },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: '500' },
  inlineError: {
    backgroundColor: Colors.error + '12', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  inlineErrorText: { fontSize: 13, color: Colors.error },
  inlineSuccess: {
    backgroundColor: Colors.success + '12', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  inlineSuccessText: { fontSize: 13, color: Colors.success },

  // Loading / empty
  centerBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  centerText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySubtext: {
    fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 24,
  },

  // Cards
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },

  // Beneficiary read view
  beneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  beneAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  beneAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  beneInfo: { flex: 1 },
  beneName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  beneNickname: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  activeChip: {
    backgroundColor: Colors.success + '18',
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10,
  },
  inactiveChip: { backgroundColor: Colors.textLight + '30' },
  activeChipText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  inactiveChipText: { color: Colors.textSecondary },
  beneDetails: {
    borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 12, marginBottom: 12, gap: 6,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: 13, color: Colors.text, fontWeight: '600', maxWidth: '65%', textAlign: 'right' },

  // Action row (edit / delete)
  actionRow: { flexDirection: 'row', gap: 10 },
  editButton: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  editButtonText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  deleteButton: {
    flex: 1, backgroundColor: Colors.error, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  deleteButtonText: { fontSize: 14, fontWeight: '700', color: Colors.backgroundLight },

  // Inline delete confirmation
  confirmBox: {
    backgroundColor: Colors.error + '10',
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  confirmText: { fontSize: 14, color: Colors.text, fontWeight: '500', marginBottom: 12, textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', gap: 10 },
  confirmCancel: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  confirmDelete: { flex: 1, backgroundColor: Colors.error, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmDeleteText: { fontSize: 14, fontWeight: '700', color: Colors.backgroundLight },

  // Edit form
  editLockedNote: { fontSize: 12, color: Colors.textSecondary, marginBottom: 14, lineHeight: 18 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  optional: { fontWeight: '400', color: Colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.background,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  toggleButton: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16,
  },
  toggleButtonActive: { borderColor: Colors.success, backgroundColor: Colors.success + '12' },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.success },
  editActionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelEditButton: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  cancelEditText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  saveButton: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: Colors.backgroundLight },

  // Add form submit
  submitButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: Colors.backgroundLight },
  buttonDisabled: { opacity: 0.6 },
});
