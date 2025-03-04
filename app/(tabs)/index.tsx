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
  Modal,
  Button,
  ImageBackground,
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

// Configuration
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

/**
 * Example placeholders:
 * Each has an id, position (x, y), and size (width, height).
 * If an animal with the same id is dropped here, we award 3 points.
 */
const placeholders = [
  { id: 1, x: 100, y: 200, width: 60, height: 60 },
  { id: 2, x: 250, y: 300, width: 60, height: 60 },
  // Add more as needed...
];

type AnimalData = {
  id: number;
  image: any;
  inTray: boolean;
  pan: Animated.ValueXY;
};

export default function PanResponderPlaceholdersWithScore() {
  const [isDragging, setIsDragging] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Scoreboard
  const [score, setScore] = useState(0);

  // Double-tap logic
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalData | null>(null);
  const [successAnimal, setSuccessAnimal] = useState<AnimalData | null>(null);
  const lastTapTime = useRef<number>(0);

  // Our animals
  const [animals, setAnimals] = useState<AnimalData[]>(() =>
    IMAGES.map((img, index) => ({
      id: index + 1,
      image: img,
      inTray: true,
      // Start them centered by default
      pan: new Animated.ValueXY({
        x: width / 2 - ITEM_SIZE / 2,
        y: height / 2 - ITEM_SIZE / 2,
      }),
    }))
  );

  // PanResponders
  const panResponders = useRef<{ [key: number]: PanResponder }>(() => ({})).current;

  // Trash box check
  const isInTrashBox = (x: number, y: number) =>
    x >= trashBox.x &&
    x <= trashBox.x + trashBox.width &&
    y >= trashBox.y &&
    y <= trashBox.y + trashBox.height;

  // Find placeholder if dropping inside its bounding box
  const findMatchingPlaceholder = (x: number, y: number): number | null => {
    for (const p of placeholders) {
      const inBox =
        x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height;
      if (inBox) {
        return p.id; // returns the placeholder's ID
      }
    }
    return null;
  };

  // Double tap detection
  const checkDoubleTap = (animal: AnimalData) => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Double tap
      setSelectedAnimal(animal);
    }
    lastTapTime.current = now;
  };

  // "Delete" function from pop-up
  const handleDeleteAnimal = () => {
    if (!selectedAnimal) return;
    // reset position
    selectedAnimal.pan.setValue({
      x: width / 2 - ITEM_SIZE / 2,
      y: height / 2 - ITEM_SIZE / 2,
    });
    // put it back in tray
    setAnimals((prev) =>
      prev.map((a) =>
        a.id === selectedAnimal.id ? { ...a, inTray: true } : a
      )
    );
    setSelectedAnimal(null);
  };

  // Create PanResponder for each animal
  animals.forEach((animal) => {
    if (!panResponders[animal.id]) {
      // For each item, track the finger exactly via gestureState.moveX/moveY
      panResponders[animal.id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          setIsDragging(true);
          checkDoubleTap(animal);

          // If the animal is in the tray, move it to the middle of the page
          if (animal.inTray) {
            // Mark it not in tray
            setAnimals((prev) =>
              prev.map((a) =>
                a.id === animal.id ? { ...a, inTray: false } : a
              )
            );
            // Instantly set the item to the screen center
            animal.pan.setValue({
              x: width / 2 - ITEM_SIZE / 2,
              y: height / 2 - ITEM_SIZE / 2,
            });
          }
        },

        onPanResponderMove: (evt, gestureState) => {
          // Move the item so it follows the finger exactly
          // Subtract half size so the finger is in the item's center
          const fingerX = gestureState.moveX - ITEM_SIZE / 2;
          const fingerY = gestureState.moveY - ITEM_SIZE / 2;
          animal.pan.setValue({ x: fingerX, y: fingerY });
        },

        onPanResponderRelease: (evt, gestureState) => {
          setIsDragging(false);

          // finalX/finalY in map coordinates (account for scroll)
          const finalX = gestureState.moveX - ITEM_SIZE / 2;
          const finalY = gestureState.moveY - ITEM_SIZE / 2 + scrollY;

          // 1) Check trash box
          if (isInTrashBox(finalX, finalY)) {
            // Return to tray
            animal.pan.setValue({
              x: width / 2 - ITEM_SIZE / 2,
              y: height / 2 - ITEM_SIZE / 2,
            });
            setAnimals((prev) =>
              prev.map((a) =>
                a.id === animal.id ? { ...a, inTray: true } : a
              )
            );
            return;
          }

          // 2) Check placeholders
          const placeholderId = findMatchingPlaceholder(finalX, finalY);
          if (placeholderId && placeholderId === animal.id) {
            // The correct animal is placed on the correct placeholder
            setSuccessAnimal(animal);
            setScore((prev) => prev + 3); // Award 3 points
            // Snap exactly to placeholder
            const p = placeholders.find((pl) => pl.id === animal.id);
            if (p) {
              animal.pan.setValue({ x: p.x, y: p.y });
            }
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
      {/* SCOREBOARD at top-left */}
      <View style={styles.scoreboard}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      {/* Double-tap pop-up */}
      <Modal
        visible={!!selectedAnimal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAnimal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAnimal && (
              <Image source={selectedAnimal.image} style={styles.popupImage} />
            )}
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <View style={{ marginRight: 8 }}>
                <Button title="Close" onPress={() => setSelectedAnimal(null)} />
              </View>
              <Button title="Delete" onPress={handleDeleteAnimal} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Success pop-up */}
      <Modal
        visible={!!successAnimal}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessAnimal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 16, marginBottom: 12 }}>
              {successAnimal
                ? `You placed Animal ${successAnimal.id} correctly! (+3 points)`
                : ''}
            </Text>
            <Button title="OK" onPress={() => setSuccessAnimal(null)} />
          </View>
        </View>
      </Modal>

      {/* SCROLLABLE MAP AREA with an ImageBackground */}
      <ScrollView
        style={styles.mapScroll}
        scrollEnabled={!isDragging}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
      >
        <View style={styles.mapContent}>
          <ImageBackground
            source={require('@/assets/images/Sea/ocean_map.png')} // Your background image
            style={styles.mapBackground}
          >
            {/* RENDER PLACEHOLDERS */}
            {placeholders.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.placeholder,
                  {
                    left: p.x,
                    top: p.y,
                    width: p.width,
                    height: p.height,
                  },
                ]}
              >
                <Text style={{ color: '#888' }}>ID {p.id}</Text>
              </View>
            ))}

            {/* Render animals on the map */}
            {animals
              .filter((animal) => !animal.inTray)
              .map((animal) => (
                <Animated.View
                  key={animal.id}
                  // The transform subtracts nothing now,
                  // because we do that math in onPanResponderMove
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
          </ImageBackground>
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
  scoreboard: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapScroll: {
    flex: 1,
  },
  mapContent: {
    width: '100%',
    height: MAP_CONTENT_HEIGHT,
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#888',
    backgroundColor: 'rgba(200,200,200,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  popupImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 12,
  },
});