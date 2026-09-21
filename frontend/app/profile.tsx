import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { router } from 'expo-router';
import { useState } from 'react';

// Type definitions
interface MenuItem {
  id: string;
  icon: string;
  label: string;
  value?: string;
  showChevron?: boolean;
  isSwitch?: boolean;
  switchValue?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// Demo user profile data
const DEMO_USER = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  phone: '+1 (555) •••-••78',
  accountNumber: '****8796',
  memberSince: 'January 2024',
  initials: 'SJ',
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      router.push('/');
    } else if (tab === 'Cards') {
      router.push('/cards');
    } else if (tab === 'History') {
      router.push('/history');
    } else if (tab === 'Profile') {
      // Already on Profile
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'This is a demo logout. No real authentication is performed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Demo Logout', 'In a real app, you would be logged out here.');
          }
        }
      ]
    );
  };

  const handleMenuItemPress = (label: string) => {
    Alert.alert('Demo Action', `This is a demo. "${label}" is not yet implemented.`);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Personal Information',
      items: [
        { id: '1', icon: '👤', label: 'Full Name', value: DEMO_USER.name, showChevron: true },
        { id: '2', icon: '📧', label: 'Email', value: DEMO_USER.email, showChevron: true },
        { id: '3', icon: '📱', label: 'Phone', value: DEMO_USER.phone, showChevron: true },
        { id: '4', icon: '🔢', label: 'Account Number', value: DEMO_USER.accountNumber, showChevron: true },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { id: '5', icon: '🔔', label: 'Push Notifications', isSwitch: true, switchValue: notificationsEnabled },
        { id: '6', icon: '📬', label: 'Email Notifications', showChevron: true },
        { id: '7', icon: '💬', label: 'SMS Alerts', showChevron: true },
      ],
    },
    {
      title: 'Security Settings',
      items: [
        { id: '8', icon: '🔐', label: 'Change Password', showChevron: true },
        { id: '9', icon: '👆', label: 'Biometric Login', isSwitch: true, switchValue: biometricEnabled },
        { id: '10', icon: '🔒', label: 'Two-Factor Authentication', showChevron: true },
        { id: '11', icon: '📋', label: 'Manage Devices', showChevron: true },
      ],
    },
    {
      title: 'Help & Support',
      items: [
        { id: '12', icon: '❓', label: 'Help Center', showChevron: true },
        { id: '13', icon: '💬', label: 'Contact Support', showChevron: true },
        { id: '14', icon: '📝', label: 'Send Feedback', showChevron: true },
        { id: '15', icon: '⭐', label: 'Rate App', showChevron: true },
      ],
    },
    {
      title: 'About',
      items: [
        { id: '16', icon: 'ℹ️', label: 'App Version', value: 'v1.0.0 (Demo)', showChevron: false },
        { id: '17', icon: '📄', label: 'Terms of Service', showChevron: true },
        { id: '18', icon: '🔒', label: 'Privacy Policy', showChevron: true },
        { id: '19', icon: '⚖️', label: 'Licenses', showChevron: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{DEMO_USER.initials}</Text>
            </View>
            <Text style={styles.profileName}>{DEMO_USER.name}</Text>
            <Text style={styles.profileEmail}>{DEMO_USER.email}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Member since {DEMO_USER.memberSince}</Text>
            </View>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 && styles.menuItemLast
                    ]}
                    onPress={() => {
                      if (item.isSwitch) {
                        if (item.id === '5') {
                          setNotificationsEnabled(!notificationsEnabled);
                        } else if (item.id === '9') {
                          setBiometricEnabled(!biometricEnabled);
                        }
                      } else {
                        handleMenuItemPress(item.label);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIcon}>
                        <Text style={styles.menuIconText}>{item.icon}</Text>
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                        {item.value && (
                          <Text style={styles.menuItemValue}>{item.value}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.menuItemRight}>
                      {item.isSwitch ? (
                        <View style={[
                          styles.switch,
                          item.switchValue && styles.switchActive
                        ]}>
                          <View style={[
                            styles.switchThumb,
                            item.switchValue && styles.switchThumbActive
                          ]} />
                        </View>
                      ) : item.showChevron ? (
                        <Text style={styles.chevron}>›</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <View style={styles.logoutSection}>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Notice */}
          <View style={styles.demoNotice}>
            <Text style={styles.demoNoticeText}>
              👤 Demo Profile • All data is fictional
            </Text>
            <Text style={styles.demoNoticeText}>
              Academic project • No real authentication
            </Text>
          </View>

          {/* Bottom padding for navigation */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {['Home', 'Cards', 'History', 'Profile'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.navItem}
              onPress={() => handleNavigate(tab)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.navIcon,
                activeTab === tab && styles.navIconActive
              ]}>
                {tab === 'Home' ? '🏠' : tab === 'Cards' ? '💳' : tab === 'History' ? '📋' : '👤'}
              </Text>
              <Text style={[
                styles.navLabel,
                activeTab === tab && styles.navLabelActive
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundLight,
  },
  backButton: {
    fontSize: 28,
    color: Colors.text,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.backgroundLight,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  menuItemValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  menuItemRight: {
    marginLeft: 12,
  },
  chevron: {
    fontSize: 24,
    color: Colors.textLight,
    fontWeight: '300',
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: Colors.accent,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: Colors.error + '15',
    borderWidth: 2,
    borderColor: Colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  demoNotice: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoNoticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.navInactive,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.navActive,
    fontWeight: '600',
  },
});
