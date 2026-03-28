import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import HomeScreen from '../screens/Home/HomeScreen';
import NewsDetailScreen from '../screens/Home/NewsDetailScreen';
import BookDetailScreen from '../screens/Book/BookDetailScreen';
import CartScreen from '../screens/Order/CartScreen';
import CheckoutScreen from '../screens/Order/CheckoutScreen';
import OrderHistoryScreen from '../screens/Order/OrderHistoryScreen';
import OrderDetailScreen from '../screens/Order/OrderDetailScreen';
import UserProfileScreen from '../screens/User/UserProfileScreen';
import EditProfileScreen from '../screens/User/EditProfileScreen';
import ChangePasswordScreen from '../screens/User/ChangePasswordScreen';
import AddressManagementScreen from '../screens/User/AddressManagementScreen';
import { theme } from '../constants/theme';

const HomeStack = createNativeStackNavigator();
const OrderStack = createNativeStackNavigator();
const UserStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: theme.colors.primaryDark,
      headerTitleStyle: { fontWeight: '700', color: theme.colors.textPrimary },
      headerStyle: { backgroundColor: theme.colors.surface },
    }}
  >
    <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Home' }} />
    <HomeStack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: 'News' }} />
    <HomeStack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Detail' }} />
  </HomeStack.Navigator>
);

const OrderStackNavigator = () => (
  <OrderStack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: theme.colors.primaryDark,
      headerTitleStyle: { fontWeight: '700', color: theme.colors.textPrimary },
      headerStyle: { backgroundColor: theme.colors.surface },
    }}
  >
    <OrderStack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
    <OrderStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    <OrderStack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Order History' }} />
    <OrderStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Detail' }} />
  </OrderStack.Navigator>
);

const UserStackNavigator = () => (
  <UserStack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: theme.colors.primaryDark,
      headerTitleStyle: { fontWeight: '700', color: theme.colors.textPrimary },
      headerStyle: { backgroundColor: theme.colors.surface },
    }}
  >
    <UserStack.Screen name="ProfileMain" component={UserProfileScreen} options={{ title: 'Profile' }} />
    <UserStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    <UserStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
    <UserStack.Screen name="AddressManagement" component={AddressManagementScreen} options={{ title: 'Addresses' }} />
  </UserStack.Navigator>
);

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = 'home';
          } else if (route.name === 'OrderTab') {
            iconName = 'shopping-cart';
          } else if (route.name === 'UserTab') {
            iconName = 'person';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="OrderTab"
        component={OrderStackNavigator}
        options={{ title: 'Cart' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('OrderTab', { screen: 'Cart' });
          },
        })}
      />
      <Tab.Screen
        name="UserTab"
        component={UserStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

