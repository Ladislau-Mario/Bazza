import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import ClientHome from '../pages/client/mainClient/home';
import Profile from '../pages/client/mainClient/profile';
import History from '../pages/client/mainClient/history';
import Notifications from '../pages/client/mainClient/notification';
import Security from '../pages/client/mainClient/security';
import Help from '../pages/client/mainClient/help';
import Settings from '../pages/client/mainClient/settings';


import DrawerContent from '../components/modules/client/mainClient/drawer';

const Drawer = createDrawerNavigator();

export default function BottomRoutes() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '75%',
          backgroundColor: '#1F2933',
        },
        overlayColor: '#00000060',
       /* sceneContainerStyle: {
          backgroundColor: '#1F2933',
        }, */
      }}
    >
      <Drawer.Screen name="Home" component={ClientHome} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="History" component={History} />
      <Drawer.Screen name="Notifications" component={Notifications} />
      <Drawer.Screen name="Security" component={Security} />
      <Drawer.Screen name="Help" component={Help} />
      <Drawer.Screen name="Settings" component={Settings} />
    </Drawer.Navigator>
  );
}