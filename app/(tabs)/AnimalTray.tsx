// AnimalTray.tsx
import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { DraxView } from 'react-native-drax';

type SeaAnimal = {
  id: string;
  name: string;
  image: any;      // require(...) for the colored image
  silhouette: any; // require(...) for the silhouette
};

interface AnimalTrayProps {
  animals: SeaAnimal[];
}

export function AnimalTray({ animals }: AnimalTrayProps) {
  // Renders each animal as a draggable item
  const renderAnimals = () => {
    return animals.map((animal) => (
      <DraxView
        key={`drag-${animal.id}`}
        style={styles.draggableItem}
        draggingStyle={styles.draggingStyle}
        dragReleasedStyle={styles.dragReleasedStyle}
        dragPayload={animal.id}
        longPressDelay={100}
      >
        <Image source={animal.image} style={styles.animalIcon} />
        <Text style={styles.animalLabel}>{animal.name}</Text>
      </DraxView>
    ));
  };

  return (
    <View style={styles.trayContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderAnimals()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  trayContainer: {
    backgroundColor: '#fff',
    height: 200, // fixed height for the tray
    paddingVertical: 10,
  },
  scrollContent: {
    // centers the row of items vertically
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  draggableItem: {
    // remove fixed height so text can fit below image
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  draggingStyle: {
    opacity: 0.2,
  },
  dragReleasedStyle: {
    opacity: 0.5,
  },
  animalIcon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 4, // space between image and text
  },
  animalLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
