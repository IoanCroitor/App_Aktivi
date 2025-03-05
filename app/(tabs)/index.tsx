import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  PanResponderInstance,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  Button,
  ImageBackground,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const TOP_OFFSET = 44;
const ITEM_SIZE = 80;
const TRAY_HEIGHT = 200;
const TRASH_SIZE = 30;
const MAP_CONTENT_HEIGHT = 1000;

const trashBoxLeft = 20;
const trashBoxTop = height - TRAY_HEIGHT - TRASH_SIZE;
const trashBox = {
  x: trashBoxLeft,
  y: trashBoxTop,
  width: TRASH_SIZE,
  height: TRASH_SIZE,
};

const IMAGES = [
  { id: 1, source: require('@/assets/images/Sea/1.png') },
  { id: 2, source: require('@/assets/images/Sea/2.png') },
  { id: 3, source: require('@/assets/images/Sea/3.png') },
  { id: 4, source: require('@/assets/images/Sea/5.png') },
  { id: 5, source: require('@/assets/images/Sea/4.png') },
  { id: 6, source: require('@/assets/images/Sea/6.png') },
  { id: 7, source: require('@/assets/images/Sea/8.png') },
  { id: 8, source: require('@/assets/images/Sea/9.png') },
  { id: 9, source: require('@/assets/images/Sea/11.png') },
  { id: 10, source: require('@/assets/images/Sea/12.png') },
];

const placeholders = [
  { id: 1, x: 75,  y: 100,  width: 60, height: 60 },
  { id: 2, x: 200, y: 100,  width: 60, height: 60 },
  { id: 3, x: 300, y: 90,   width: 60, height: 60 },
  { id: 4, x: 130, y: 200,  width: 60, height: 60 },
  { id: 5, x: 300, y: 200,  width: 60, height: 60 },
  { id: 6, x: 250, y: 290,  width: 60, height: 60 },
  { id: 7, x: 120, y: 280,  width: 60, height: 60 },
  { id: 8, x: 140, y: 330,  width: 60, height: 60 },
  { id: 9, x: 220, y: 540,  width: 60, height: 60 },
  { id: 10, x: 120, y: 600,  width: 60, height: 60 },
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
  const [score, setScore] = useState(0);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalData | null>(null);
  const [successAnimal, setSuccessAnimal] = useState<AnimalData | null>(null);
  const lastTapTime = useRef<number>(0);

  const [animals, setAnimals] = useState<AnimalData[]>(() =>
    IMAGES.map((imgObj) => ({
      id: imgObj.id,
      image: imgObj.source,
      inTray: true,
      pan: new Animated.ValueXY({
        x: width / 2 - ITEM_SIZE / 2,
        y: height / 2 - ITEM_SIZE / 2,
      }),
    }))
  );

  const panResponders = useRef<{ [key: number]: PanResponderInstance }>({}).current;

  const isInTrashBox = (x: number, y: number) =>
    x >= trashBox.x &&
    x <= trashBox.x + trashBox.width &&
    y >= trashBox.y &&
    y <= trashBox.y + trashBox.height;

  // Given a point, check if it falls within any placeholder.
  // Returns the placeholder's id if found; otherwise, null.
  const findMatchingPlaceholder = (x: number, y: number): number | null => {
    for (const p of placeholders) {
      const inBox =
        x >= p.x && x <= p.x + p.width &&
        y >= p.y && y <= p.y + p.height;
      if (inBox) return p.id;
    }
    return null;
  };

  const checkDoubleTap = (animal: AnimalData) => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      setSelectedAnimal(animal);
    }
    lastTapTime.current = now;
  };

  const handleDeleteAnimal = () => {
    if (!selectedAnimal) return;
    selectedAnimal.pan.setValue({
      x: width / 2 - ITEM_SIZE / 2,
      y: height / 2 - ITEM_SIZE / 2,
    });
    setAnimals((prev) =>
      prev.map((a) =>
        a.id === selectedAnimal.id ? { ...a, inTray: true } : a
      )
    );
    setSelectedAnimal(null);
  };

  // For each animal, create a PanResponder that calculates a grab offset
  animals.forEach((animal) => {
    if (!panResponders[animal.id]) {
      let dragOffset = { x: 0, y: 0 };
      panResponders[animal.id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
          setIsDragging(true);
          checkDoubleTap(animal);

          if (animal.inTray) {
            // For tray animals, remove them from the tray and snap to center.
            setAnimals((prev) =>
              prev.map((a) =>
                a.id === animal.id ? { ...a, inTray: false } : a
              )
            );
            animal.pan.setValue({
              x: width / 2 - ITEM_SIZE / 2,
              y: height / 2 - ITEM_SIZE / 2,
            });
            // Assume a center grab for tray animals.
            dragOffset = { x: ITEM_SIZE / 2, y: ITEM_SIZE / 2 };
          } else {
            // For animals already on the map, record the touch offset within the image.
            dragOffset = {
              x: evt.nativeEvent.locationX,
              y: evt.nativeEvent.locationY,
            };
          }
        },

        onPanResponderMove: (evt, gestureState) => {
          // Maintain the initial grab offset so the same point on the animal stays under your finger.
          const fingerX = gestureState.moveX - dragOffset.x;
          const fingerY = gestureState.moveY - TOP_OFFSET - dragOffset.y;
          animal.pan.setValue({ x: fingerX, y: fingerY });
        },

        onPanResponderRelease: (evt, gestureState) => {
          setIsDragging(false);
          const finalX = gestureState.moveX - dragOffset.x;
          const finalY = gestureState.moveY - TOP_OFFSET - dragOffset.y + scrollY;

          // Check if dropped in the trash box.
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
            return;
          }

          // Check if dropped over a placeholder.
          const placeholderId = findMatchingPlaceholder(finalX, finalY);
          if (placeholderId !== null && placeholderId === animal.id) {
            setSuccessAnimal(animal);
            setScore((prev) => prev + 3);
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
      {/* Scoreboard */}
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

      {/* Scrollable map */}
      <ScrollView
        style={styles.mapScroll}
        scrollEnabled={!isDragging}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
      >
        <View style={styles.mapContent}>
          <ImageBackground
            source={require('@/assets/images/Sea/ocean_map.png')}
            style={styles.mapBackground}
          >
            {/* Render placeholders for drop detection.
                They are hidden from view and do not block touch events. */}
            {placeholders.map((p) => (
              <View
                key={p.id}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  width: p.width,
                  height: p.height,
                  backgroundColor: 'transparent',
                  // Uncomment the following lines for debugging:
                  // borderWidth: 1,
                  // borderColor: 'rgba(0,0,0,0.2)',
                }}
              />
            ))}

            {/* Animals on the map */}
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
          </ImageBackground>
        </View>
      </ScrollView>

      {/* Tray for animals */}
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

      {/* Trash box */}
      <View style={styles.trashContainer}>
        <Text style={styles.trashLabel}>Trash</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scoreboard: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 8,
  },
  scoreText: { fontSize: 16, fontWeight: 'bold' },
  mapScroll: { flex: 1 },
  mapContent: { width: '100%', height: MAP_CONTENT_HEIGHT },
  mapBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: { position: 'absolute' },
  mapItem: { position: 'absolute', width: ITEM_SIZE, height: ITEM_SIZE },
  itemImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    resizeMode: 'contain',
  },
  itemLabel: { fontSize: 12, textAlign: 'center' },
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