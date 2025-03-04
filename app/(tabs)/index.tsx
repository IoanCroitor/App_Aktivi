import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { DraxProvider, DraxView } from 'react-native-drax';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimalTray } from './AnimalTray';

type SeaAnimal = {
  id: string;
  name: string;
  image: any;
  // Each animal's correct position on the map
  position: { top: number; left: number };
};

export default function OceanMapScreen() {
  const { width } = useWindowDimensions();

  const [animals] = useState<SeaAnimal[]>([
    {
      id: 'whale',
      name: 'Blue Whale',
      image: require('@/assets/images/Sea/1.png'),
      position: { top: 600, left: 50 },
    },
    {
      id: 'shark',
      name: 'Shark',
      image: require('@/assets/images/Sea/2.png'),
      position: { top: 300, left: 180 },
    },
    // ... add more animals as needed
  ]);

  // Track which animals have been correctly placed on the map
  const [placedAnimals, setPlacedAnimals] = useState<string[]>([]);

  // When an animal is dropped into its correct drop zone, mark it as placed
  const handleReceiveDrop = (draggedAnimalId: string, dropZoneAnimalId: string) => {
    console.log(`Attempting drop: dragged ${draggedAnimalId} onto ${dropZoneAnimalId}`);
    if (draggedAnimalId === dropZoneAnimalId) {
      console.log(`Successful drop for: ${draggedAnimalId}`);
      setPlacedAnimals((prev) => [...prev, draggedAnimalId]);
    } else {
      console.log(`Drop failed: ${draggedAnimalId} does not match ${dropZoneAnimalId}`);
    }
  };

  // Render drop zones at the positions defined by each animal.
  // When an animal is correctly dropped, its image appears in the drop zone.
  const renderDropZones = () => {
    return animals.map((animal) => {
      const isPlaced = placedAnimals.includes(animal.id);
      return (
        <DraxView
          key={`drop-${animal.id}`}
          style={[
            styles.dropZone,
            { top: animal.position.top, left: animal.position.left },
          ]}
          animateSnapback={false}
          onReceiveDragDrop={(event) => {
            console.log('Drop event on zone for:', animal.id, event);
            const draggedId = event.dragged?.payload;
            if (draggedId) {
              handleReceiveDrop(draggedId, animal.id);
            }
          }}
        >
          {isPlaced && (
            <Image source={animal.image} style={styles.animalImage} />
          )}
        </DraxView>
      );
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DraxProvider>
        <View style={styles.container}>
          {/* The map is placed in a ScrollView so that users can scroll vertically */}
          <ScrollView style={styles.mapScroll} contentContainerStyle={styles.mapScrollContent}>
            <View style={[styles.mapWrapper, { width }]}>
              <Image
                source={require('@/assets/images/Sea/ocean_map.png')}
                style={styles.oceanMapImage}
              />
              {renderDropZones()}
            </View>
          </ScrollView>

          {/* The tray is overlayed at the bottom of the screen */}
          <View style={styles.trayOverlay}>
            <AnimalTray animals={animals} placedAnimals={placedAnimals} />
          </View>
        </View>
      </DraxProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1CEDC',
  },
  mapScroll: {
    flex: 1,
  },
  // Add some bottom padding so the scrollable map does not get hidden behind the tray
  mapScrollContent: {
    paddingBottom: 150,
  },
  mapWrapper: {
    position: 'relative',
    height: 1000, // adjust as needed for your map
  },
  oceanMapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  dropZone: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  // Overlay the tray fixed at the bottom
  trayOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
