// OceanMapScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  DraxProvider,
  DraxView,
} from 'react-native-drax';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimalTray } from './AnimalTray'; // import the tray component

type SeaAnimal = {
  id: string;
  name: string;
  image: any;      // require(...) for the colored image
  silhouette: any; // require(...) for the silhouette
  position: { top: number; left: number };
};

export default function OceanMapScreen() {
  const { width } = useWindowDimensions();

  const [animals] = useState<SeaAnimal[]>([
    {
      id: 'whale',
      name: 'Blue Whale',
      image: require('@/assets/images/Sea/1.png'),
      silhouette: require('@/assets/images/Sea/1.png'),
      position: { top: 600, left: 50 },
    },
    {
      id: 'shark',
      name: 'Shark',
      image: require('@/assets/images/Sea/2.png'),
      silhouette: require('@/assets/images/Sea/2.png'),
      position: { top: 300, left: 180 },
    },
    // ... more animals
  ]);

  // Track which animals have been correctly placed
  const [placedAnimals, setPlacedAnimals] = useState<string[]>([]);

  // Handle dropping an animal onto the correct silhouette
  const handleReceiveDrop = (draggedAnimalId: string, dropZoneAnimalId: string) => {
    if (draggedAnimalId === dropZoneAnimalId) {
      setPlacedAnimals((prev) => [...prev, draggedAnimalId]);
    }
  };

  // Render silhouettes or colored images on the map
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
            const draggedId = event.dragged?.payload;
            if (draggedId) {
              handleReceiveDrop(draggedId, animal.id);
            }
          }}
        >
          <Image
            source={isPlaced ? animal.image : animal.silhouette}
            style={styles.animalSilhouette}
          />
        </DraxView>
      );
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DraxProvider>
        <View style={styles.container}>
          {/* 
            A ScrollView that contains the tall map so you can scroll vertically.
            The map is as wide as the screen (width) and very tall (height: 2000 as example).
          */}
          <ScrollView style={styles.mapScroll} contentContainerStyle={styles.mapScrollContent}>
            <View style={[styles.mapWrapper, { width }]}>
              <Image
                source={require('@/assets/images/Sea/ocean_map.png')}
                style={styles.oceanMapImage}
              />
              {renderDropZones()}
            </View>
          </ScrollView>

          {/* Bottom tray: pinned, always visible */}
          <AnimalTray animals={animals} />
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
  mapScrollContent: {
    // If you want extra padding or spacing, you can add it here
  },
  mapWrapper: {
    position: 'relative',
    // The height here determines how "tall" your map is, so you can scroll down
    height: 1000, // for example, 2000 px tall
  },
  oceanMapImage: {
    // Make the image fill the entire wrapper (width x 2000 tall),
    // but "contain" ensures you see the entire map
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
  animalSilhouette: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    opacity: 0.7,
  },
});
