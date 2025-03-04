import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { DraxView } from 'react-native-drax';

type SeaAnimal = {
  id: string;
  name: string;
  image: any;
  silhouette?: any;
};

interface AnimalTrayProps {
  animals: SeaAnimal[];
  placedAnimals?: string[];
}

export function AnimalTray({ animals, placedAnimals = [] }: AnimalTrayProps) {
  // Render only animals that have not yet been placed
  const renderAnimals = () => {
    return animals
      .filter((animal) => !placedAnimals.includes(animal.id))
      .map((animal) => (
        <DraxView
          key={`drag-${animal.id}`}
          style={styles.draggableItem}
          draggingStyle={styles.draggingStyle}
          dragReleasedStyle={styles.dragReleasedStyle}
          dragPayload={animal.id}
          longPressDelay={100}
          onDragEnd={(event) => {
            console.log(`Drag ended for: ${animal.id}`, event);
          }}
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
    height: 250,
    overflow: 'visible',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    overflow: 'visible',
  },
  draggableItem: {
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
    marginBottom: 4,
  },
  animalLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
