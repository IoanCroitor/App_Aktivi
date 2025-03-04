import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

const IMAGES = [
  require('@/assets/images/Sea/1.png'),
  require('@/assets/images/Sea/2.png'),
  require('@/assets/images/Sea/3.png'),
  require('@/assets/images/Sea/4.png'),
  require('@/assets/images/Sea/5.png'),
  require('@/assets/images/Sea/6.png'),
  require('@/assets/images/Sea/7.png'),
  require('@/assets/images/Sea/8.png'),
  require('@/assets/images/Sea/9.png'),
  require('@/assets/images/Sea/10.png'),
];

const { width, height } = Dimensions.get('window');

const ITEM_SIZE = 80;  
const TRAY_HEIGHT = 200;
const TRASH_SIZE = 30;
const MAP_CONTENT_HEIGHT = 1000;

// Position the trash box on the left, right above the tray
const trashBoxLeft = 20;
const trashBoxTop = height - TRAY_HEIGHT - TRASH_SIZE;

const trashBox = {
  x: trashBoxLeft,
  y: trashBoxTop,
  width: TRASH_SIZE,
  height: TRASH_SIZE,
};

type AnimalData = {
  id: number;
  image: any;
  inTray: boolean;
  pan: Animated.ValueXY;
};

export default function PanResponderScrollExample() {
  const [isDragging, setIsDragging] = useState(false);

  // Track how far the map is scrolled
  const [scrollY, setScrollY] = useState(0);

  // Initialize 10 animals
  const [animals, setAnimals] = useState<AnimalData[]>(() =>
    IMAGES.map((img, index) => ({
      id: index + 1,
      image: img,
      inTray: true,
      pan: new Animated.ValueXY({
        x: width / 2 - ITEM_SIZE / 2,
        y: height / 2 - ITEM_SIZE / 2,
      }),
    }))
  );

  // Store a PanResponder for each animal
  const panResponders = useRef<{ [key: number]: PanResponder }>(() => ({})).current;

  // Check if a point (x,y) is within the trash box
  const isInTrashBox = (x: number, y: number) => {
    return (
      x >= trashBox.x &&
      x <= trashBox.x + trashBox.width &&
      y >= trashBox.y &&
      y <= trashBox.y + trashBox.height
    );
  };

  animals.forEach((animal) => {
    if (!panResponders[animal.id]) {
      panResponders[animal.id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          setIsDragging(true);

          // If the animal is in the tray, move it onto the map
          if (animal.inTray) {
            setAnimals((prev) =>
              prev.map((a) =>
                a.id === animal.id ? { ...a, inTray: false } : a
              )
            );
          }
          animal.pan.extractOffset();
        },

        onPanResponderMove: Animated.event(
          [null, { dx: animal.pan.x, dy: animal.pan.y }],
          { useNativeDriver: false }
        ),

        onPanResponderRelease: () => {
          setIsDragging(false);
          // Merge offset so the item stays at its release position
          animal.pan.flattenOffset();

          // Convert local offsets to screen coordinates by adding scrollY
          const finalX = (animal.pan.x as any).__getValue();
          const finalY = (animal.pan.y as any).__getValue() + scrollY;

          // If it's dropped inside the trash box, reset to tray
          if (isInTrashBox(finalX, finalY)) {
            animal.pan.setValue({
              x: width / 2 - ITEM_SIZE / 2,
              y: height / 2 - ITEM_SIZE / 2,
            });
            setAnimals((prev) =>
              prev.map((a) =>
                a.id === animal.id ? { ...a, inTray: true } : a
              )
            );
          }
        },
        onPanResponderEnd: () => {
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      });
    }
  });

  return (
    <View style={styles.container}>
      {/* SCROLLABLE MAP AREA */}
      <ScrollView
        style={styles.mapScroll}
        scrollEnabled={!isDragging}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
      >
        <View style={styles.mapContent}>
          <Image
            source={require('@/assets/images/Sea/ocean_map.png')}
            style={styles.mapImage}
          />

          {/* Render animals on the map */}
          {animals
            .filter((animal) => !animal.inTray)
            .map((animal) => (
              <Animated.View
                key={animal.id}
                style={[
                  styles.mapItem,
                  {
                    transform: [
                      { translateX: animal.pan.x },
                      { translateY: animal.pan.y },
                    ],
                  },
                ]}
                {...panResponders[animal.id].panHandlers}
              >
                <Image source={animal.image} style={styles.itemImage} />
              </Animated.View>
            ))}
        </View>
      </ScrollView>

      {/* TRAY AT THE BOTTOM */}
      <View style={styles.trayContainer}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.trayContent}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isDragging}
        >
          {animals
            .filter((animal) => animal.inTray)
            .map((animal) => (
              <View
                key={animal.id}
                style={styles.trayItem}
                {...panResponders[animal.id].panHandlers}
              >
                <Image source={animal.image} style={styles.itemImage} />
                <Text style={styles.itemLabel}>Animal {animal.id}</Text>
              </View>
            ))}
        </ScrollView>
      </View>

      {/* Trash Box on the left, right on top of the tray */}
      <View style={styles.trashContainer}>
        <Text style={styles.trashLabel}>Trash</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapScroll: {
    flex: 1,
  },
  mapContent: {
    width: '100%',
    height: MAP_CONTENT_HEIGHT,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapItem: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  itemImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    resizeMode: 'contain',
  },
  itemLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  trayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TRAY_HEIGHT,
    backgroundColor: '#fff',
  },
  trayContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  trayItem: {
    marginHorizontal: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  trashContainer: {
    position: 'absolute',
    width: TRASH_SIZE,
    height: TRASH_SIZE,
    left: trashBoxLeft,
    top: trashBoxTop,
    backgroundColor: 'red',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});