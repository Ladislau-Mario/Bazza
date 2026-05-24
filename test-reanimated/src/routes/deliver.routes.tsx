import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import DeliverHome from '../pages/deliver/mainDeliver/home';
import Earnings from '../pages/deliver/mainDeliver/earnings';
import DeliverProfile from '../pages/deliver/mainDeliver/profile';

import { CurvedBottomTabs } from '../components/common/curvedTabs';
import FireIcon from '../components/common/icons/fireIcon';
import EarningsIcon from '../components/common/icons/earningsIcon';
import ProfileIcon from '../components/common/icons/profileIcon';
import DeliverNotifications from '../pages/deliver/mainDeliver/notification';
import DeliverHistory from '../pages/deliver/mainDeliver/history';
import DeliverSupport from '../pages/deliver/mainDeliver/support';
import DeliverDocuments from '../pages/deliver/mainDeliver/documents';

const Tab = createBottomTabNavigator();

export default function DeliverRoutes() {
  return (
    <Tab.Navigator
  tabBar={(props) => (
    <CurvedBottomTabs
      {...props}
      gradients={['#1F2933', '#2D3748']}
    />
  )}
  screenOptions={{ headerShown: false }}
  initialRouteName="DeliverHome"  // garante que abre na página de Entregas
>
  
  
  <Tab.Screen
    name="Earnings"
    component={Earnings}
    options={{
      tabBarLabel: 'Ganhos',
      tabBarIcon: ({ focused }) => (
        <EarningsIcon size={22} color={focused ? '#CB1D00' : '#ffffff60'} />
      ),
    }}
  />

  {/* Entregas no centro */}
  <Tab.Screen
    name="DeliverHome"
    component={DeliverHome}
    options={{
      tabBarLabel: 'Entregas',
      tabBarIcon: ({ focused }) => (
        <FireIcon size={22} color={focused ? '#CB1D00' : '#ffffff60'} />
      ),
    }}
  />

  <Tab.Screen
    name="DeliverProfile"
    component={DeliverProfile}
    options={{
      tabBarLabel: 'Perfil',
      tabBarIcon: ({ focused }) => (
        <ProfileIcon size={23} color={focused ? '#CB1D00' : '#ffffff60'} />
      ),
    }}
  />
<Tab.Screen
    name="DeliverNotifications"
    component={DeliverNotifications}
    options={{
      tabBarButton: () => null,
    }}
  />
  <Tab.Screen
    name="DeliverHistory"
    component={DeliverHistory}
    options={{
      tabBarButton: () => null,
    }}
  />
  <Tab.Screen
    name="DeliverDocuments"
    component={DeliverDocuments}
    options={{
      tabBarButton: () => null,
    }}
  />
</Tab.Navigator>

  );
}